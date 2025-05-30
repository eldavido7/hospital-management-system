"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchSuggestionsProps {
  placeholder?: string
  onSearch: (term: string) => void
  onSelect?: (item: any) => void
  getSuggestions: (term: string) => Promise<any[]>
  renderSuggestion: (item: any) => React.ReactNode
  className?: string
  inputClassName?: string
  debounceMs?: number
}

export function SearchSuggestions({
  placeholder = "Search...",
  onSearch,
  onSelect,
  getSuggestions,
  renderSuggestion,
  className,
  inputClassName,
  debounceMs = 300,
}: SearchSuggestionsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fetch suggestions with debounce
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([])
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await getSuggestions(searchTerm)
        setSuggestions(results)
        setShowSuggestions(true)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm, getSuggestions, debounceMs])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(searchTerm)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (item: any) => {
    if (onSelect) {
      onSelect(item)
    }
    setShowSuggestions(false)
  }

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          className={cn("pl-8", inputClassName)}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.trim().length >= 2 && setSuggestions.length > 0 && setShowSuggestions(true)}
        />
        {isLoading && (
          <div className="absolute right-2.5 top-2.5">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {suggestions.map((item, index) => (
              <li
                key={index}
                className="px-3 py-2 hover:bg-accent cursor-pointer"
                onClick={() => handleSuggestionClick(item)}
              >
                {renderSuggestion(item)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

