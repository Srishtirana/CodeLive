import './App.css'
import { Editor } from '@monaco-editor/react'
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from 'react'
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

function App() {
  console.log("Backend URL:", import.meta.env.VITE_BACKEND_URL)

  const editorRef = useRef(null)
  const providerRef = useRef(null)

  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  })

  const [users, setUsers] = useState([])

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  // ✅ Only assign editor
  const handleMount = (editor) => {
    editorRef.current = editor
  }

  const handlejoin = (e) => {
    e.preventDefault()
    const value = e.target.username.value
    setUsername(value)
    window.history.pushState({}, "", "?username=" + value)
  }

  // ✅ SOCKET PROVIDER
  useEffect(() => {
    if (!username) return

    const backendURL = import.meta.env.VITE_BACKEND_URL

    if (!backendURL) {
      console.error("Backend URL missing!")
      return
    }

    const provider = new SocketIOProvider(
      backendURL,
      "monaco-demo",
      ydoc,
      {
        autoConnect: true,
        connect: true,
        transports: ["websocket"]
      }
    )

    provider.on("status", (event) => {
      console.log("Socket status:", event.status)
    })

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

    return () => {
      provider.disconnect()
    }
  }, [username])

  // ✅ FIXED MONACO BINDING (correct timing)
  useEffect(() => {
    if (!editorRef.current) return
    if (!providerRef.current) return

    console.log("Binding Monaco editor...")

    const binding = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      providerRef.current.awareness
    )

    return () => {
      binding.destroy()
    }
  }, [editorRef.current, providerRef.current])

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
              className="bg-gray-800 px-3 py-2 rounded-lg mb-2 font-mono text-sm tracking-wide">
              {user.username}
            </li>
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