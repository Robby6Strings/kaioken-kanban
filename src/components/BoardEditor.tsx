import { useModel, useState, useEffect, ElementProps, useRef } from "kaioken"
import { Board, List, ListItem, loadItems, loadLists, Tag } from "../idb"
import { useBoardStore } from "../state/board"
import { Button } from "./atoms/Button"
import { Input } from "./atoms/Input"
import { Spinner } from "./atoms/Spinner"
import { DialogHeader } from "./dialog/DialogHeader"
import { useGlobal } from "../state/global"
import { ActionMenu } from "./ActionMenu"
import { MoreIcon } from "./icons/MoreIcon"
import { maxBoardNameLength, maxTagNameLength } from "../constants"
import { Transition } from "kaioken"
import { Drawer } from "./dialog/Drawer"
import { useListsStore } from "../state/lists"
import { useBoardTagsStore } from "../state/boardTags"
import { useItemsStore } from "../state/items"

export function BoardEditorDrawer() {
  const { boardEditorOpen, setBoardEditorOpen } = useGlobal()
  return (
    <Transition
      in={boardEditorOpen}
      duration={{
        in: 40,
        out: 150,
      }}
      element={(state) =>
        state === "exited" ? null : (
          <Drawer state={state} close={() => setBoardEditorOpen(false)}>
            <BoardEditor />
          </Drawer>
        )
      }
    />
  )
}

function BoardEditor() {
  const { setBoardEditorOpen, boards, updateBoards } = useGlobal()
  const {
    value: { board },
    deleteBoard,
    archiveBoard,
    restoreBoard,
    updateSelectedBoard,
  } = useBoardStore()

  const [titleRef, title] = useModel<HTMLInputElement, string>(
    board?.title || ""
  )
  const [ctxMenuOpen, setCtxMenuOpen] = useState(false)
  const ctxMenuButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  async function handleSubmit() {
    const res = await updateSelectedBoard({ ...board, title })
    updateBoards(boards.map((b) => (b.id === res.id ? res : b)))
  }

  async function handleDeleteClick() {
    if (!board) return
    await deleteBoard()
    updateBoards(boards.filter((b) => b.id !== board.id))
    setBoardEditorOpen(false)
  }

  async function handleArchiveClick() {
    const res = await archiveBoard()
    updateBoards(boards.map((b) => (b.id === res.id ? res : b)))
    setBoardEditorOpen(false)
  }

  async function handleRestoreClick() {
    if (!board) return
    await restoreBoard()
    setBoardEditorOpen(false)
  }

  return (
    <>
      <DialogHeader>
        Board Details
        <div className="relative">
          <button
            ref={ctxMenuButtonRef}
            className="w-9 flex justify-center items-center h-full"
            onclick={() => setCtxMenuOpen((prev) => !prev)}
          >
            <MoreIcon />
          </button>
          <ActionMenu
            btn={ctxMenuButtonRef}
            open={ctxMenuOpen}
            close={() => setCtxMenuOpen(false)}
            items={[
              board?.archived
                ? {
                    text: "Restore",
                    onclick: handleRestoreClick,
                  }
                : {
                    text: "Archive",
                    onclick: handleArchiveClick,
                  },
              {
                text: "Delete",
                onclick: handleDeleteClick,
              },
            ]}
          />
        </div>
      </DialogHeader>
      <div className="flex gap-2">
        <Input
          className="bg-opacity-15 bg-black w-full border-0"
          ref={titleRef}
          maxLength={maxBoardNameLength}
          placeholder="(Unnamed Board)"
        />
        <Button
          variant="primary"
          onclick={handleSubmit}
          disabled={title === board?.title}
        >
          Save
        </Button>
      </div>
      <br />
      <BoardTagsEditor board={board} />
      <br />
      <ArchivedLists board={board} />
      <br />
      <ArchivedItems board={board} />
    </>
  )
}

function BoardTagsEditor({ board }: { board: Board | null }) {
  const {
    addTag,
    value: { tags },
  } = useBoardTagsStore()

  function handleAddTagClick() {
    if (!board) return
    addTag(board.id)
  }

  return (
    <ListContainer>
      <ListTitle>Board Tags</ListTitle>

      <div className="mb-2">
        {tags.map((tag) => (
          <BoardTagEditor key={tag.id} tag={tag} />
        ))}
      </div>
      <div className="flex">
        <Button variant="link" className="ml-auto" onclick={handleAddTagClick}>
          Add Tag
        </Button>
      </div>
    </ListContainer>
  )
}

function BoardTagEditor({ tag }: { tag: Tag }) {
  const { updateTag } = useBoardTagsStore()

  const handleTitleChange = (e: Event) => {
    const title = (e.target as HTMLInputElement).value
    updateTag({ ...tag, title })
  }

  const handleColorChange = (e: Event) => {
    const color = (e.target as HTMLInputElement).value
    updateTag({ ...tag, color })
  }

  return (
    <ListItemContainer className="items-center">
      <Input
        value={tag.title}
        onchange={handleTitleChange}
        placeholder="(Unnamed Tag)"
        className="border-0 text-sm flex-grow"
        maxLength={maxTagNameLength}
      />
      <input
        value={tag.color}
        onchange={handleColorChange}
        type="color"
        className="cursor-pointer"
      />
    </ListItemContainer>
  )
}

function ArchivedItems({ board }: { board: Board | null }) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<(ListItem & { list: string })[]>([])
  const { restoreItem } = useItemsStore()
  const {
    value: { lists },
  } = useListsStore()

  useEffect(() => {
    if (!board) return
    setLoading(true)
    ;(async () => {
      const res = await Promise.all(
        lists.map(async (list) => {
          return (await loadItems(list.id, true)).map((item) => ({
            ...item,
            list: list.title,
          }))
        })
      )
      setLoading(false)
      setItems(res.flat())
    })()
  }, [])

  async function handleItemRestore(item: ListItem & { list: string }) {
    const { list, ...rest } = item
    await restoreItem(rest)
    setItems((prev) => prev.filter((l) => l.id !== item.id))
  }

  return (
    <ListContainer>
      <ListTitle>Archived Items</ListTitle>
      {loading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <span className="text-sm text-gray-400">
          <i>No archived items</i>
        </span>
      ) : (
        items.map((item) => (
          <ListItemContainer key={item.id}>
            <span className="text-sm">{item.title || "(Unnamed item)"}</span>
            <div className="flex flex-col items-end">
              <span className="text-xs align-super text-gray-400 text-nowrap mb-2">
                {item.list || "(Unnamed list)"}
              </span>
              <Button
                variant="link"
                className="px-0 py-0"
                onclick={() => handleItemRestore(item)}
              >
                Restore
              </Button>
            </div>
          </ListItemContainer>
        ))
      )}
    </ListContainer>
  )
}

function ArchivedLists({ board }: { board: Board | null }) {
  const [loading, setLoading] = useState(false)
  const [lists, setLists] = useState<List[]>([])
  const { restoreList } = useListsStore()
  useEffect(() => {
    if (!board) return
    setLoading(true)
    ;(async () => {
      const res = await loadLists(board.id, true)
      setLists(res)
      setLoading(false)
    })()
  }, [])

  async function handleSendToBoard(list: List) {
    await restoreList(list)
    setLists((prev) => prev.filter((l) => l.id !== list.id))
  }

  return (
    <ListContainer>
      <ListTitle>Archived Lists</ListTitle>
      {loading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : lists.length === 0 ? (
        <span>
          <i>No archived lists</i>
        </span>
      ) : (
        lists.map((list) => (
          <ListItemContainer key={list.id}>
            <span className="text-sm">{list.title || "(Unnamed List)"}</span>
            <Button
              variant="link"
              className="text-sm py-0 px-0"
              onclick={() => handleSendToBoard(list)}
            >
              Restore
            </Button>
          </ListItemContainer>
        ))
      )}
    </ListContainer>
  )
}

function ListContainer({ children }: ElementProps<"div">) {
  return <div className="p-3 bg-black bg-opacity-15">{children}</div>
}

function ListTitle({ children }: ElementProps<"div">) {
  return (
    <h4 className="text-sm mb-2 pb-1 border-b border-white text-gray-400 border-opacity-10">
      {children}
    </h4>
  )
}

function ListItemContainer({ children, className }: ElementProps<"div">) {
  return (
    <div
      className={`flex gap-4 p-2 justify-between bg-white bg-opacity-5 border-b border-black border-opacity-30 last:border-b-0 ${
        className || ""
      }`}
    >
      {children}
    </div>
  )
}
