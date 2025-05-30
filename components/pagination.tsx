"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    onPageChange(page)
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max pages to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if at the beginning
      if (currentPage <= 2) {
        end = 3
      }

      // Adjust if at the end
      if (currentPage >= totalPages - 1) {
        start = totalPages - 2
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pageNumbers.push("...")
      }

      // Add page numbers
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pageNumbers.push("...")
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(1)}
        disabled={isFirstPage}
        title="First Page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={isFirstPage}
        title="Previous Page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center space-x-1">
        {getPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <Button
              key={index}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              className="min-w-8"
            >
              {page}
            </Button>
          ) : (
            <span key={index} className="px-2">
              {page}
            </span>
          ),
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={isLastPage}
        title="Next Page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(totalPages)}
        disabled={isLastPage}
        title="Last Page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

