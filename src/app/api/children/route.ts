import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { displayName, email, password } = await request.json()

    // サーバーサイドのSupabaseクライアント（親のセッションを確認）
    const supabase = await createServerClient()

    // 親ユーザーを確認
    const {
      data: { user: parentUser },
    } = await supabase.auth.getUser()

    if (!parentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 親のプロフィールを確認
    const { data: parentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', parentUser.id)
      .single()

    if (parentProfile?.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can add children' }, { status: 403 })
    }

    // Service Role Key を使用してAdmin操作を行う
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 子供アカウントを作成（Admin API）
    const { data: childAuth, error: childAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // メール確認をスキップ
      })

    if (childAuthError) {
      if (childAuthError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: `登録に失敗しました: ${childAuthError.message}` },
        { status: 400 }
      )
    }

    if (!childAuth.user) {
      return NextResponse.json({ error: '子供アカウントの作成に失敗しました' }, { status: 500 })
    }

    // 子供のプロフィール作成（Admin権限で）
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: childAuth.user.id,
      display_name: displayName,
      role: 'child',
      start_date: new Date().toISOString().split('T')[0],
    })

    if (profileError) {
      console.error('Profile error:', profileError)
      // プロフィール作成失敗時はユーザーも削除
      await supabaseAdmin.auth.admin.deleteUser(childAuth.user.id)
      return NextResponse.json({ error: 'プロフィールの作成に失敗しました' }, { status: 500 })
    }

    // 親子関係を登録（Admin権限で）
    const { error: relationError } = await supabaseAdmin.from('family_relations').insert({
      parent_id: parentUser.id,
      child_id: childAuth.user.id,
    })

    if (relationError) {
      console.error('Relation error:', relationError)
      // 親子関係作成失敗時はユーザーとプロフィールも削除
      await supabaseAdmin.from('user_profiles').delete().eq('id', childAuth.user.id)
      await supabaseAdmin.auth.admin.deleteUser(childAuth.user.id)
      return NextResponse.json({ error: '親子関係の登録に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      child: {
        id: childAuth.user.id,
        displayName,
      },
    })
  } catch (error) {
    console.error('Add child API error:', error)
    return NextResponse.json({ error: '登録中にエラーが発生しました' }, { status: 500 })
  }
}
