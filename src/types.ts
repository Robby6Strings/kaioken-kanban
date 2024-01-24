export interface ListItem {
  id: string
  title: string
  description: string
  archived: boolean
  created: Date
  order: number
}

export interface List {
  id: string
  title: string
  items: ListItem[]
  archived: boolean
  created: Date
  order: number
  dropArea: HTMLElement | null
}

export interface DragTarget {
  index: number
  initial: boolean
  listId: string
}

export interface ClickedItem {
  id: string
  index: number
  dragging: boolean
  listId: string
  element: HTMLElement
  domRect: DOMRect
  mouseOffset: {
    x: number
    y: number
  }
}

export interface Board {
  id: string
  title: string
  lists: List[]
}
