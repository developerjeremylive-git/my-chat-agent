// Servicio para manejar las operaciones relacionadas con el modelo

/**
 * Actualiza el modelo seleccionado en el servidor
 * @param modelName Nombre del modelo a seleccionar
 * @returns Respuesta del servidor con el estado de la actualización
 */
export const updateModel = async (modelName: string): Promise<{ success: boolean; model: string }> => {
  try {
    const response = await fetch('/api/model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelTemp: modelName }),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el modelo');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en updateModel:', error);
    throw error;
  }
};