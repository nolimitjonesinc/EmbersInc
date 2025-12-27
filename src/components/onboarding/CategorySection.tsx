'use client'

import { motion } from 'framer-motion'
import { InterestCategory } from '@/data/interests'
import { InterestCard } from './InterestCard'

interface CategorySectionProps {
  category: InterestCategory
  selectedInterests: Set<string>
  onToggleInterest: (interestId: string) => void
}

export function CategorySection({ category, selectedInterests, onToggleInterest }: CategorySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Category header */}
      <div>
        <h2 className="text-xl font-serif font-semibold text-[#f9f7f2]">
          {category.title}
        </h2>
        <p className="text-sm text-[#f9f7f2]/50 mt-1">
          {category.description}
        </p>
      </div>

      {/* Interest cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {category.items.map((item) => (
          <InterestCard
            key={item.id}
            item={item}
            isSelected={selectedInterests.has(item.id)}
            onToggle={() => onToggleInterest(item.id)}
          />
        ))}
      </div>
    </motion.div>
  )
}
