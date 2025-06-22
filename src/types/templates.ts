export interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
  categories: string[];
}

export const TEMPLATE_CATEGORIES = [
  'all',
  'life',
  'technology',
  'finance',
  'sales-marketing',
  'research',
  'people-ops',
  'education'
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

export const TEMPLATES: Template[] = [
  // Research Templates
  {
    id: 'open-research-explorer',
    title: 'Explorador de Investigación Abierta',
    description: 'Busca en los mejores sitios de acceso abierto publicaciones de alta calidad. Solo ingresa tu tema o pregunta para obtener resultados relevantes.',
    icon: 'microscope',
    categories: ['research']
  },
  {
    id: 'get-started',
    title: 'Empezar con Perplexity',
    description: 'Saca el máximo provecho de Perplexity. Escribe lo que estás intentando hacer y obtén consejos personalizados, sugerencias de funciones y más.',
    icon: 'compass',
    categories: ['research', 'education']
  },
  {
    id: 'patent-researcher',
    title: 'Investigador de Patentes',
    description: 'Busca, resume y analiza patentes y arte previo. Solo ingresa un producto, idea o palabra clave para comenzar.',
    icon: 'document-text',
    categories: ['research']
  },
  {
    id: 'citation-generator',
    title: 'Generador de Citas',
    description: 'Pega enlaces de fuentes para generar citas y bibliografías precisas en formato APA, MLA, Chicago, Harvard o IEEE.',
    icon: 'document-duplicate',
    categories: ['research', 'education']
  },
  {
    id: 'key-opinion-leader',
    title: 'Analizador de Líderes de Opinión',
    description: 'Identifica y analiza a los principales líderes de opinión en un área terapéutica. Solo ingresa una enfermedad o tema para obtener información estructurada.',
    icon: 'megaphone',
    categories: ['research']
  },
  // Education Templates
  {
    id: 'essay-grader',
    title: 'Calificador de Ensayos',
    description: 'Sube tu ensayo y recibe comentarios detallados basados en las instrucciones de la tarea y la rúbrica.',
    icon: 'pencil-square',
    categories: ['education']
  },
  {
    id: 'tutor-me',
    title: 'Tutor Personal',
    description: 'Obtén ayuda paso a paso para aprender un concepto, resolver problemas y mejorar tu comprensión.',
    icon: 'academic-cap',
    categories: ['education']
  },
  // Add more templates for other categories as needed
];
