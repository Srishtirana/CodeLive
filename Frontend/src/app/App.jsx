import './App.css'
import { Editor } from '@monaco-editor/react'
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from 'react'
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

function App() {
  const editorRef = useRef(null)
  const providerRef = useRef(null) // 

  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  })

  const [users, setUsers] = useState([])

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const handleMount = (editor) => {
    editorRef.current = editor

    
    new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      providerRef.current?.awareness
    )
  }

  const handlejoin = (e) => {
    e.preventDefault()
    const value = e.target.username.value
    setUsername(value)
    window.history.pushState({}, "", "?username=" + value)
  }

  useEffect(() => {
    if (username) {
      const provider = new SocketIOProvider(
        "http://localhost:3000",
        "monaco-demo",
        ydoc,
        { autoConnect: true }
      )

      providerRef.current = provider 

      provider.awareness.setLocalStateField("user", {
        username: username
      })

      const updateUsers = () => {
        const states = Array.from(provider.awareness.getStates().values())
        setUsers(
          states
            .filter(state => state.user && state.user.username)
            .map(state => state.user)
        )
      }

      updateUsers()
      provider.awareness.on("change", updateUsers)

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null)
      }

      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        provider.disconnect()
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
    }
  }, [username])

  if (!username) {
    return (
      <main className="h-screen w-full bg-black flex items-center justify-center">
        <form onSubmit={handlejoin} className="flex flex-col gap-4 items-center">
          <input
            type="text"
            placeholder="Enter your username"
            className="p-2 rounded-md bg-gray-700 text-white"
            name="username"
          />
          <button className="p-2 rounded-md bg-pink-900 text-white font-bold">
            Join
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-black flex gap-4 p-4">
      <aside className="h-full w-1/4 bg-pink-900 rounded-2xl">
        <h2 className="text-white text-2xl font-bold p-4">Users</h2>
        <ul className="text-white p-4">
          {users.map((user, index) => (
            <li key={index}
            className="bg-gray-800 px-3 py-2 rounded-lg mb-2 font-mono text-sm tracking-wide">{user.username}</li>
          ))}
        </ul>
      </aside>

      <section className="w-3/4 bg-gray-900 rounded-2xl overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// some comment"
          theme="vs-dark"
          onMount={handleMount}
        />
      </section>
    </main>
  )
}

export default App