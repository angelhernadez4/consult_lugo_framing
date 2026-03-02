/**
 * Lista de artículos definidos e indefinidos en español.
 * Se utiliza para ignorarlos al calcular el género o para no plurizarlos incorrectamente en frases.
 */
export const spanishArticles: string[] = [
    'de',
    'el',
    'la',
    'los',
    'las',
    'un',
    'una',
    'unos',
    'unas'
];

/**
 * Convierte una palabra o frase al plural siguiendo reglas gramaticales del español.
 * Maneja casos complejos como:
 * - Palabras compuestas o frases (e.g., "tipo de cambio").
 * - Artículos dentro de la frase.
 * - Excepciones y reglas de acentuación (e,g., "régimen" -> "regímenes").
 * 
 * @param text - La palabra o frase en singular
 * @returns La versión pluralizada del texto.
 */
export const pluralize = (text: string) => {
    const lowerWord: string = text.toLowerCase()
    const words: string[] = lowerWord.split(' ');

    if (words.length > 1) {
        const hasArticle = spanishArticles.find((art) => words.includes(art))

        if (!hasArticle) {
            return pluralizePhrase(lowerWord)
        }

        words[0] = pluralizeWord(words[0])
    }
    return words.join(' ')
}

/**
 * Función interna que aplica las reglas de pluralización a una sola palabra.
 * Reglas implementadas:
 * - Terminación en vocal átona -> +s.
 * - Terminación en consonante o vocal tónica (í, ú) -> +es
 * - Terminación en 'z' -> 'ces'
 * - Manejo de tildes (e,g., régimen).
 * @param rawWord 
 * @returns 
 */
const pluralizeWord = (rawWord: string) => {
    const word: string = rawWord.toLowerCase()
    if (word === 'régimen') return 'regímenes';

    if (word.endsWith('ón')) return `${word.slice(0, -2)}ones`

    if (word.endsWith('ción')) return `${word.slice(0, -3)}iones`
    
    if (word.endsWith('z')) return `${word.slice(0, -1)}ces`

    if (word.endsWith('s') || word.endsWith('x')) return word

    if (word.endsWith('í') || word.endsWith('ú')) return `${word}es`

    if (word.endsWith('a') || word.endsWith('e') || word.endsWith('o')) return `${word}s`

    if (word.endsWith('y')) return `${word.slice(0, -1)}yes`

    return `${word}es`
}

/**
 * Función auxiliar que pluraliza una frase completa, asegurando la coherencia gramatical.
 * Itera sobre cada palabra de la frase:
 * - Si la palabra es un artículo o preposición listada en `spanishArticles`, la mantiene intacta (ej: 'de').
 * - Si no lo es, aplica la función `pluralizeWord` para pluralizarla.
 * @param phrase - La frase en singular a procesar (ej: "el día festivo").
 * @returns La frase resultante en plural (ej: "Los días festivos")
 */
const pluralizePhrase = (phrase: string) => {
    const words: string[] = phrase.split(' ')
    const pluralizedWords = words.map((word) => spanishArticles.includes(word) ? word : pluralizeWord(word))
    return pluralizedWords.join(' ')
}