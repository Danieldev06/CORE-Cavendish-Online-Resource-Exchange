import { useState, useRef, useEffect } from "react"
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  Tag,
  Calendar,
  BookOpen,
  Layers,
  MoreHorizontal,
  Check,
} from "lucide-react"

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroup {
  key: string
  label: string
  icon: React.ReactNode
  options: FilterOption[]
  multiple?: boolean
  searchable?: boolean
}

interface AdvancedFilterBuilderProps {
  groups: FilterGroup[]
  activeFilters: Record<string, string | string[]>
  onChange: (filters: Record<string, string | string[]>) => void
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  showCounts?: boolean
  className?: string
}

function MultiSelectPopover({
  label,
  icon,
  options,
  selected,
  onChange,
  searchable = false,
  showCounts = false,
}: {
  label: string
  icon: React.ReactNode
  options: FilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
  searchable?: boolean
  showCounts?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const hasSelection = selected.length > 0

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-all min-w-[160px] ${
          hasSelection
            ? "bg-navy-800 text-white border-navy-800"
            : "bg-white text-navy-700 border-navy-200 hover:border-navy-300 hover:bg-navy-50"
        }`}
      >
        <span className="text-navy-500">{icon}</span>
        <span className="truncate flex-1">{hasSelection ? `${selected.length} selected` : label}</span>
        <ChevronDown size={14} className={isOpen ? "rotate-180" : ""} />
        {hasSelection && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onChange([])
            }}
            className="ml-1 p-0.5 text-navy-300 hover:text-white rounded transition"
          >
            <X size={12} />
          </button>
        )}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-navy-200 rounded-xl shadow-lg overflow-hidden min-w-[220px]"
        >
          {searchable && (
            <div className="p-3 border-b border-navy-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-navy-50 border border-navy-100 rounded-lg text-navy-800 placeholder-navy-400 focus:ring-2 focus:ring-navy-200 focus:border-navy-300"
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-navy-400 text-sm">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-navy-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggleOption(option.value)}
                    className="w-4 h-4 text-navy-600 border-navy-300 rounded focus:ring-2 focus:ring-navy-200"
                  />
                  <span className="text-sm text-navy-700 truncate flex-1">{option.label}</span>
                  {showCounts && option.count !== undefined && (
                    <span className="text-[10px] text-navy-400 bg-navy-50 px-1.5 py-0.5 rounded">
                      {option.count}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
          <div className="border-t border-navy-100 p-2.5 flex gap-2">
            <button
              onClick={() => onChange([])}
              className="flex-1 px-3 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50 rounded-lg transition"
            >
              Clear all
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-navy-800 hover:bg-navy-700 rounded-lg transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SingleSelectPopover({
  label,
  icon,
  options,
  selected,
  onChange,
  searchable = false,
}: {
  label: string
  icon: React.ReactNode
  options: FilterOption[]
  selected: string
  onChange: (value: string) => void
  searchable?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasSelection = !!selected

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-all min-w-[160px] ${
          hasSelection
            ? "bg-navy-800 text-white border-navy-800"
            : "bg-white text-navy-700 border-navy-200 hover:border-navy-300 hover:bg-navy-50"
        }`}
      >
        <span className="text-navy-500">{icon}</span>
        <span className="truncate flex-1">
          {hasSelection
            ? options.find((o) => o.value === selected)?.label ?? selected
            : label}
        </span>
        <ChevronDown size={14} className={isOpen ? "rotate-180" : ""} />
        {hasSelection && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onChange("")
            }}
            className="ml-1 p-0.5 text-navy-300 hover:text-white rounded transition"
          >
            <X size={12} />
          </button>
        )}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-navy-200 rounded-xl shadow-lg overflow-hidden min-w-[220px]"
        >
          {searchable && (
            <div className="p-3 border-b border-navy-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-navy-50 border border-navy-100 rounded-lg text-navy-800 placeholder-navy-400 focus:ring-2 focus:ring-navy-200 focus:border-navy-300"
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto p-1.5">
            <button
              onClick={() => onChange("")}
              className={`w-full px-3 py-2.5 rounded-lg text-sm transition ${
                !hasSelection
                  ? "bg-navy-50 text-navy-800 font-medium"
                  : "text-navy-600 hover:bg-navy-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Check size={14} className={!hasSelection ? "text-navy-600" : "invisible"} />
                All {label}
              </span>
            </button>
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2.5 rounded-lg text-sm transition text-left ${
                  selected === option.value
                    ? "bg-navy-50 text-navy-800 font-medium"
                    : "text-navy-600 hover:bg-navy-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Check
                    size={14}
                    className={selected === option.value ? "text-navy-600" : "invisible"}
                  />
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchInput({
  value,
  onChange,
  onClear,
  placeholder,
  onSubmit,
}: {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder: string
  onSubmit?: () => void
}) {
  return (
    <div className="relative flex-1 max-w-xl">
      <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
        placeholder={placeholder}
        className="w-full pl-11 pr-12 py-3 bg-white border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition shadow-sm"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}

export function AdvancedFilterBuilder({
  groups,
  activeFilters,
  onChange,
  onSearch,
  searchPlaceholder = "Search resources, courses, authors, or keywords...",
  showCounts = true,
  className = "",
}: AdvancedFilterBuilderProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleSearchSubmit = () => {
    onSearch?.(searchQuery)
  }

  const handleFilterChange = (key: string, value: string | string[]) => {
    const newFilters = { ...activeFilters }
    if (value === "" || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    onChange(newFilters)
  }

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchQuery

  const clearAllFilters = () => {
    setSearchQuery("")
    onChange({})
    onSearch?.("")
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <SearchInput
        value={searchQuery}
        onChange={handleSearchChange}
        onClear={() => setSearchQuery("")}
        placeholder={searchPlaceholder}
        onSubmit={handleSearchSubmit}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-navy-500 font-medium">
          <Filter size={13} /> Filters:
        </div>

        {groups.map((group) => {
          const selected = activeFilters[group.key]
          const isMulti = group.multiple
          const selectedArray = isMulti ? (selected as string[]) || [] : selected ? [selected as string] : []
          const hasSelection = isMulti ? selectedArray.length > 0 : !!selected

          return (
            <div key={group.key} className="relative">
              {isMulti ? (
                <MultiSelectPopover
                  label={group.label}
                  icon={group.icon}
                  options={group.options}
                  selected={selectedArray}
                  onChange={(values) => handleFilterChange(group.key, values)}
                  searchable={group.searchable}
                  showCounts={showCounts}
                />
              ) : (
                <SingleSelectPopover
                  label={group.label}
                  icon={group.icon}
                  options={group.options}
                  selected={selected as string}
                  onChange={(value) => handleFilterChange(group.key, value)}
                  searchable={group.searchable}
                />
              )}
            </div>
          )
        })}

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>
    </div>
  )
}

export function createRepositoryFilterGroups(
  courses: any[],
  resources: any[],
  RESOURCE_TYPE_LABELS: Record<string, string>
): FilterGroup[] {
  const programmeOptions = Array.from(
    new Set(resources.map((r) => r.programme).filter(Boolean))
  ).map((p) => ({ value: p, label: p }))

  const yearOptions = [1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: `Year ${y}` }))
  const semesterOptions = [1, 2].map((s) => ({ value: String(s), label: `Semester ${s}` }))

  return [
    {
      key: "type",
      label: "Resource Type",
      icon: <Layers size={14} />,
      options: Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
      multiple: true,
      searchable: true,
    },
    {
      key: "course",
      label: "Course",
      icon: <BookOpen size={14} />,
      options: courses.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` })),
      multiple: true,
      searchable: true,
    },
    {
      key: "programme",
      label: "Programme",
      icon: <GraduationCap size={14} />,
      options: programmeOptions,
      multiple: true,
      searchable: true,
    },
    {
      key: "year",
      label: "Year",
      icon: <Calendar size={14} />,
      options: yearOptions,
      multiple: true,
    },
    {
      key: "semester",
      label: "Semester",
      icon: <Tag size={14} />,
      options: semesterOptions,
      multiple: true,
    },
  ]
}