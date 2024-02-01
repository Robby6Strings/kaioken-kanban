import { Portal, useContext } from "kaioken"
import { BoardProvider } from "./state/BoardProvider"
import { GlobalProvider } from "./state/GlobalProvider"
import { Board } from "./components/Board"
import { BoardContext } from "./state/board"
import { useGlobal } from "./state/global"
import { Select } from "./components/atoms/Select"
import { MoreIcon } from "./components/icons/MoreIcon"
import { ListItemClone } from "./components/ListItemClone"
import { ListClone } from "./components/ListClone"
import { ItemEditorModal } from "./components/ItemEditor"
import { ListEditorModal } from "./components/ListEditor"
import { MainDrawer } from "./components/MainDrawer"

export function App() {
  return (
    <GlobalProvider>
      <BoardProvider>
        <Nav />
        <Main />
      </BoardProvider>
    </GlobalProvider>
  )
}

function Nav() {
  const { boards, setMainDrawerOpen } = useGlobal()
  const board = useContext(BoardContext)

  return (
    <nav className="p-4 flex justify-between">
      <Select
        value={board?.id}
        options={boards.map((board) => ({
          key: board.id,
          text: board.title || "(New Board)",
        }))}
        onChange={console.log}
      />
      <button onclick={() => setMainDrawerOpen(true)} className="py-2 px-3">
        <MoreIcon />
      </button>
    </nav>
  )
}

function Main() {
  const { updateMousePos, clickedItem, clickedList } = useGlobal()

  function handleMouseMove(e: MouseEvent) {
    updateMousePos({
      x: e.clientX,
      y: e.clientY,
    })
  }
  return (
    <main onmousemove={handleMouseMove}>
      <Board />
      <Portal container={document.getElementById("portal")!}>
        {clickedItem?.dragging && <ListItemClone item={clickedItem} />}
        {clickedList?.dragging && <ListClone list={clickedList} />}
        <ItemEditorModal />
        <ListEditorModal />
        <MainDrawer />
      </Portal>
    </main>
  )
}
