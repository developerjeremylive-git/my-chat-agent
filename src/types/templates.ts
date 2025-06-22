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

  // Technology Templates
  {
    id: 'code-explainer',
    title: 'Explicador de Código',
    description: 'Explica código en lenguaje natural. Pega cualquier fragmento de código y obtén una explicación detallada de su funcionamiento.',
    icon: 'code',
    categories: ['technology']
  },
  {
    id: 'bug-finder',
    title: 'Buscador de Errores',
    description: 'Encuentra y soluciona errores en tu código. Describe el problema o pega el código con el error para recibir ayuda.',
    icon: 'bug',
    categories: ['technology']
  },
  {
    id: 'api-docs',
    title: 'Generador de Documentación API',
    description: 'Crea documentación clara y detallada para tus APIs a partir del código fuente o especificaciones.',
    icon: 'document-text',
    categories: ['technology']
  },

  // Finance Templates
  {
    id: 'expense-tracker',
    title: 'Seguimiento de Gastos',
    description: 'Registra y analiza tus gastos personales. Obtén informes detallados y recomendaciones de ahorro.',
    icon: 'currency-dollar',
    categories: ['finance', 'life']
  },
  {
    id: 'investment-analyzer',
    title: 'Analizador de Inversiones',
    description: 'Evalúa oportunidades de inversión, analiza riesgos y proyecciones de rendimiento.',
    icon: 'chart-bar',
    categories: ['finance']
  },

  // Sales & Marketing Templates
  {
    id: 'email-campaign',
    title: 'Generador de Campañas de Email',
    description: 'Crea correos electrónicos efectivos para campañas de marketing con llamados a la acción claros.',
    icon: 'envelope',
    categories: ['sales-marketing']
  },
  {
    id: 'social-media-planner',
    title: 'Planificador de Redes Sociales',
    description: 'Planifica y programa publicaciones para todas tus redes sociales desde un solo lugar.',
    icon: 'share',
    categories: ['sales-marketing']
  },
  {
    id: 'seo-analyzer',
    title: 'Analizador SEO',
    description: 'Optimiza tu contenido para motores de búsqueda con sugerencias de palabras clave y mejoras de contenido.',
    icon: 'magnifying-glass',
    categories: ['sales-marketing']
  },

  // People & Ops Templates
  {
    id: 'meeting-notes',
    title: 'Generador de Minutas',
    description: 'Crea minutas profesionales a partir de notas de reuniones, con puntos de acción y seguimiento.',
    icon: 'document-text',
    categories: ['people-ops']
  },
  {
    id: 'okr-planner',
    title: 'Planificador de OKRs',
    description: 'Define y da seguimiento a Objetivos y Resultados Clave para tu equipo u organización.',
    icon: 'flag',
    categories: ['people-ops']
  },

  // Life Templates
  {
    id: 'meal-planner',
    title: 'Planificador de Comidas',
    description: 'Crea planes de comidas semanales personalizados según tus preferencias y restricciones dietéticas.',
    icon: 'cake',
    categories: ['life']
  },
  {
    id: 'workout-planner',
    title: 'Planificador de Entrenamientos',
    description: 'Diseña rutinas de ejercicio personalizadas según tus objetivos de acondicionamiento físico.',
    icon: 'bolt',
    categories: ['life']
  },
  {
    id: 'travel-planner',
    title: 'Planificador de Viajes',
    description: 'Organiza tu próximo viaje con itinerarios personalizados, presupuesto y recomendaciones locales.',
    icon: 'airplane',
    categories: ['life']
  },
  {
    id: 'habit-tracker',
    title: 'Seguimiento de Hábitos',
    description: 'Establece, da seguimiento y mejora tus hábitos diarios y rutinas.',
    icon: 'check-circle',
    categories: ['life']
  },
  {
    id: 'mindfulness',
    title: 'Guía de Meditación',
    description: 'Sesiones guiadas de meditación y atención plena para reducir el estrés.',
    icon: 'moon',
    categories: ['life']
  },
  {
    id: 'book-summaries',
    title: 'Resúmenes de Libros',
    description: 'Obtén resúmenes detallados de libros de no ficción populares.',
    icon: 'book-open',
    categories: ['life', 'education']
  },
  // Nuevas plantillas para Tecnología
  {
    id: 'cloud-migration',
    title: 'Asistente de Migración a la Nube',
    description: 'Planifica y ejecuta migraciones seguras a la nube con estrategias personalizadas.',
    icon: 'server',
    categories: ['technology']
  },
  {
    id: 'code-review',
    title: 'Asistente de Revisión de Código',
    description: 'Analiza y mejora la calidad del código con revisiones automatizadas.',
    icon: 'code',
    categories: ['technology']
  },
  {
    id: 'data-pipeline',
    title: 'Diseñador de Pipelines de Datos',
    description: 'Crea y optimiza flujos de trabajo de procesamiento de datos.',
    icon: 'database',
    categories: ['technology']
  },
  {
    id: 'devops-helper',
    title: 'Asistente de DevOps',
    description: 'Automatiza tareas de integración y despliegue continuo.',
    icon: 'refresh',
    categories: ['technology']
  },

  // Nuevas plantillas para Finanzas
  {
    id: 'tax-optimizer',
    title: 'Optimizador de Impuestos',
    description: 'Encuentra deducciones fiscales y optimiza tu declaración de impuestos.',
    icon: 'receipt-tax',
    categories: ['finance']
  },
  {
    id: 'investment-portfolio',
    title: 'Analizador de Cartera de Inversión',
    description: 'Evalúa y optimiza tu cartera de inversiones con análisis de riesgo y rendimiento.',
    icon: 'trending-up',
    categories: ['finance']
  },
  {
    id: 'budget-planner',
    title: 'Planificador de Presupuesto',
    description: 'Crea y da seguimiento a presupuestos personales o empresariales.',
    icon: 'calculator',
    categories: ['finance']
  },
  {
    id: 'financial-reports',
    title: 'Generador de Reportes Financieros',
    description: 'Crea reportes financieros profesionales con análisis detallados.',
    icon: 'presentation-chart-bar',
    categories: ['finance']
  },

  // Nuevas plantillas para Ventas y Marketing
  {
    id: 'sales-funnel',
    title: 'Analizador de Embudo de Ventas',
    description: 'Optimiza cada etapa de tu embudo de conversión.',
    icon: 'funnel',
    categories: ['sales-marketing']
  },
  {
    id: 'customer-segmentation',
    title: 'Segmentación de Clientes',
    description: 'Identifica y clasifica a tus clientes para estrategias de marketing personalizadas.',
    icon: 'user-group',
    categories: ['sales-marketing']
  },
  {
    id: 'social-media-analytics',
    title: 'Analítica de Redes Sociales',
    description: 'Mide y mejora el rendimiento de tus publicaciones en redes sociales.',
    icon: 'share',
    categories: ['sales-marketing']
  },
  {
    id: 'email-analytics',
    title: 'Analítica de Correos Electrónicos',
    description: 'Mide el rendimiento de tus campañas de email marketing.',
    icon: 'envelope',
    categories: ['sales-marketing']
  },

  // Nuevas plantillas para Personas y Operaciones
  {
    id: 'employee-onboarding',
    title: 'Plan de Incorporación de Empleados',
    description: 'Automatiza y mejora el proceso de onboarding de nuevos empleados.',
    icon: 'user-add',
    categories: ['people-ops']
  },
  {
    id: 'performance-reviews',
    title: 'Evaluaciones de Desempeño',
    description: 'Crea y gestiona evaluaciones de desempeño para tu equipo.',
    icon: 'star',
    categories: ['people-ops']
  },
  {
    id: 'team-retrospective',
    title: 'Retrospectiva de Equipo',
    description: 'Facilita sesiones de retrospectiva efectivas para equipos ágiles.',
    icon: 'refresh',
    categories: ['people-ops']
  },
  {
    id: 'compliance-tracker',
    title: 'Seguimiento de Cumplimiento',
    description: 'Gestiona y da seguimiento al cumplimiento de políticas y regulaciones.',
    icon: 'shield-check',
    categories: ['people-ops']
  }
];
