import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'Configured' : 'Missing')
console.log('Supabase Key:', supabaseAnonKey ? 'Configured' : 'Missing')

let supabase

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please create a .env.local file with:')
  console.error('VITE_SUPABASE_URL=your_supabase_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  
  // Create a mock client for development
  const mockClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      updateUser: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
    },
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase not configured' } }) })
    })
  }
  
  supabase = mockClient
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Función para probar la conexión y verificar las tablas
  window.testSupabaseConnection = async () => {
    console.log('=== TESTING SUPABASE CONNECTION ===')
    
    try {
      // Probar conexión básica
      console.log('1. Testing basic connection...')
      const { data: session, error: sessionError } = await supabase.auth.getSession()
      console.log('Session:', session, 'Error:', sessionError)
      
      // Probar acceso a la tabla folders
      console.log('2. Testing folders table...')
      const { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .limit(5)
      console.log('Folders:', folders, 'Error:', foldersError)
      
      // Probar acceso a la tabla notes
      console.log('3. Testing notes table...')
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .limit(5)
      console.log('Notes:', notes, 'Error:', notesError)
      
      // Probar inserción de prueba (solo si no hay datos)
      if (folders && folders.length === 0) {
        console.log('4. Testing folder creation...')
        const { data: newFolder, error: createError } = await supabase
          .from('folders')
          .insert({
            name: 'Test Folder',
            color: '#666666',
            user_id: '00000000-0000-0000-0000-000000000000' // ID temporal para prueba
          })
          .select()
          .single()
        console.log('New folder:', newFolder, 'Error:', createError)
      }
      
      console.log('=== CONNECTION TEST COMPLETED ===')
      return { success: true, folders, notes }
    } catch (error) {
      console.error('Connection test failed:', error)
      return { success: false, error }
    }
  }
}

export { supabase }
