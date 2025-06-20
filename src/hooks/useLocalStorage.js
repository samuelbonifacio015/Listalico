import { useState, useEffect } from 'react'

export function useLocalStorage(key, initialValue) {
  // Estado para almacenar nuestro valor
  // Pasa la función de estado inicial a useState así que la lógica solo se ejecuta una vez
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Obtener desde localStorage por clave
      const item = window.localStorage.getItem(key)
      // Analizar JSON almacenado o si no hay ninguno, devolver valor inicial
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // Si hay error, devolver valor inicial
      console.log(error)
      return initialValue
    }
  })

  // Devolver una versión envuelta de la función setState de useState que ...
  // ... persiste el nuevo valor en localStorage.
  const setValue = (value) => {
    try {
      // Permitir que el valor sea una función para que tengamos la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // Guardar estado
      setStoredValue(valueToStore)
      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      // Una implementación más avanzada manejaría el error
      console.log(error)
    }
  }

  return [storedValue, setValue]
} 