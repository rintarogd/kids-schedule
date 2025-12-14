import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json()

    // サーバーサイドのSupabaseクライアント
    const supabase = await createServerClient()

    // 親ユーザーを確認
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 自分のデータか、親として子供のデータを追加するか確認
    const targetUserId = taskData.user_id

    if (targetUserId !== user.id) {
      // 他人のデータを追加しようとしている場合、親子関係を確認
      const { data: relation } = await supabase
        .from('family_relations')
        .select('*')
        .eq('parent_id', user.id)
        .eq('child_id', targetUserId)
        .single()

      if (!relation) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }
    }

    // Service Role Key を使用してRLSをバイパス
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

    const { data, error } = await supabaseAdmin.from('scheduled_tasks').insert({
      user_id: targetUserId,
      week_start: taskData.week_start,
      day_of_week: taskData.day_of_week,
      category: taskData.category,
      subcategory: taskData.subcategory,
      task_type: taskData.task_type,
      planned_minutes: taskData.planned_minutes,
    }).select().single()

    if (error) {
      console.error('Task insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, task: data })
  } catch (error) {
    console.error('Add task API error:', error)
    return NextResponse.json({ error: '登録中にエラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    // サーバーサイドのSupabaseクライアント
    const supabase = await createServerClient()

    // ユーザーを確認
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Service Role Key を使用
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

    // タスクの所有者を確認
    const { data: task } = await supabaseAdmin
      .from('scheduled_tasks')
      .select('user_id')
      .eq('id', taskId)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // 自分のタスクか、親として子供のタスクを削除するか確認
    if (task.user_id !== user.id) {
      const { data: relation } = await supabase
        .from('family_relations')
        .select('*')
        .eq('parent_id', user.id)
        .eq('child_id', task.user_id)
        .single()

      if (!relation) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }
    }

    const { error } = await supabaseAdmin
      .from('scheduled_tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Task delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task API error:', error)
    return NextResponse.json({ error: '削除中にエラーが発生しました' }, { status: 500 })
  }
}
