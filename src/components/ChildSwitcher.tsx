'use client'

import { useState, useRef, useEffect } from 'react'
import { useFamily } from '@/contexts/FamilyContext'
import AddChildModal from './AddChildModal'

export default function ChildSwitcher() {
  const { isParent, children, selectedChildId, setSelectedChildId, refreshFamily } = useFamily()
  const [isOpen, setIsOpen] = useState(false)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedChild = children.find((c) => c.id === selectedChildId)

  console.log('ChildSwitcher: isParent:', isParent, 'children:', children, 'selectedChildId:', selectedChildId)

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 親でない場合は何も表示しない
  if (!isParent) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg hover:bg-[#F0F0F0] transition-colors"
      >
        <span className="text-sm font-medium text-[#202020]">
          {selectedChild?.displayName || '子供を選択'}
        </span>
        <svg
          className={`w-4 h-4 text-[#666666] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-50">
          {children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => {
                setSelectedChildId(child.id)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F5F5F5] ${
                child.id === selectedChildId
                  ? 'bg-[#FEF2F2] text-[#DC4C3E] font-medium'
                  : 'text-[#202020]'
              }`}
            >
              {child.displayName}
            </button>
          ))}
          {children.length < 3 && (
            <>
              {children.length > 0 && <div className="border-t border-[#E5E5E5]" />}
              <button
                type="button"
                onClick={() => {
                  setShowAddChildModal(true)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#DC4C3E] hover:bg-[#F5F5F5] rounded-b-lg flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                子どもを追加
              </button>
            </>
          )}
        </div>
      )}

      <AddChildModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onSuccess={() => refreshFamily()}
      />
    </div>
  )
}
