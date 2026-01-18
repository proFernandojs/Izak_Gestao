import React from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: todos, error } = await supabase.from('todos').select('*')
    if (error) {
      console.error('Supabase error:', error)
    }

    return (
      <main>
        <h1>Todos</h1>
        <ul>
          {todos?.map((todo) => (
            <li key={todo.id}>{todo.title ?? JSON.stringify(todo)}</li>
          ))}
        </ul>
      </main>
    )
  } catch (err) {
    console.error('Erro na Page /pagina:', err)
    return (
      <main>
        <h1>Todos</h1>
        <p>Erro ao carregar dados. Veja o console do servidor.</p>
      </main>
    )
  }
}
