'use client'

import { motion } from 'framer-motion'
import { InterestItem } from '@/data/interests'

interface InterestCardProps {
  item: InterestItem
  isSelected: boolean
  onToggle: () => void
}

export function InterestCard({ item, isSelected, onToggle }: InterestCardProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full text-left p-5 rounded-2xl transition-all duration-300
        border-2
        ${isSelected
          ? 'border-[#E86D48] bg-[#E86D48]/10 shadow-lg shadow-[#E86D48]/20'
          : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20'
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#E86D48] flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}

      {/* Icon */}
      <div className="text-3xl mb-3">{item.icon}</div>

      {/* Title */}
      <h3 className={`text-lg font-semibold mb-1 ${isSelected ? 'text-[#E86D48]' : 'text-[#f9f7f2]'}`}>
        {item.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-[#f9f7f2]/60 leading-relaxed">
        {item.description}
      </p>

      {/* Subcategories preview */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.subcategories.slice(0, 3).map((sub) => (
          <span
            key={sub.id}
            className={`text-xs px-2 py-0.5 rounded-full ${
              isSelected ? 'bg-[#E86D48]/20 text-[#E86D48]' : 'bg-white/10 text-[#f9f7f2]/50'
            }`}
          >
            {sub.label}
          </span>
        ))}
        {item.subcategories.length > 3 && (
          <span className="text-xs px-2 py-0.5 text-[#f9f7f2]/30">
            +{item.subcategories.length - 3} more
          </span>
        )}
      </div>
    </motion.button>
  )
}
