export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Max Flow Scheduler API',
    version: '1.0.0',
    description: 'API para planificacion de guardias medicas.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'health' },
    { name: 'auth' },
    { name: 'doctors' },
    { name: 'periods' },
    { name: 'schedule' },
    { name: 'sprints' },
    { name: 'availability' },
    { name: 'runs' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          requestId: { type: 'string' },
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      Doctor: {
        type: 'object',
        required: ['id', 'name', 'active'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          active: { type: 'boolean' },
          maxTotalDaysDefault: { type: 'integer', nullable: true },
        },
      },
      PeriodDemand: {
        type: 'object',
        required: ['dayId', 'requiredDoctors'],
        properties: {
          dayId: { type: 'string', format: 'date' },
          requiredDoctors: { type: 'integer' },
        },
      },
      Period: {
        type: 'object',
        required: ['id', 'name', 'startsOn', 'endsOn', 'demands'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          startsOn: { type: 'string', format: 'date' },
          endsOn: { type: 'string', format: 'date' },
          demands: {
            type: 'array',
            items: { $ref: '#/components/schemas/PeriodDemand' },
          },
        },
      },
      SprintAvailabilityEntry: {
        type: 'object',
        required: ['doctorId', 'periodId', 'dayId', 'source', 'updatedByUserId', 'updatedByRole', 'updatedAt'],
        properties: {
          doctorId: { type: 'string' },
          periodId: { type: 'string' },
          dayId: { type: 'string', format: 'date' },
          source: { type: 'string', enum: ['doctor-self-service', 'planner-override'] },
          updatedByUserId: { type: 'string' },
          updatedByRole: { type: 'string', enum: ['doctor', 'planner'] },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Sprint: {
        type: 'object',
        required: ['id', 'name', 'periodId', 'status', 'globalConfig', 'doctorIds', 'availability', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          periodId: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'ready-to-solve', 'solved'] },
          globalConfig: {
            type: 'object',
            required: ['requiredDoctorsPerShift', 'maxDaysPerDoctorDefault'],
            properties: {
              requiredDoctorsPerShift: { type: 'integer' },
              maxDaysPerDoctorDefault: { type: 'integer' },
            },
          },
          doctorIds: { type: 'array', items: { type: 'string' } },
          availability: { type: 'array', items: { $ref: '#/components/schemas/SprintAvailabilityEntry' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      SprintRun: {
        type: 'object',
        required: ['id', 'sprintId', 'executedAt', 'status', 'inputSnapshot'],
        properties: {
          id: { type: 'string' },
          sprintId: { type: 'string' },
          executedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['succeeded', 'failed'] },
          inputSnapshot: { type: 'object' },
          outputSnapshot: { type: 'object', nullable: true },
          error: {
            type: 'object',
            nullable: true,
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      SolveResponse: {
        type: 'object',
        required: ['contractVersion', 'isFeasible', 'assignedCount', 'uncoveredDays', 'assignments'],
        properties: {
          contractVersion: { type: 'string' },
          isFeasible: { type: 'boolean' },
          assignedCount: { type: 'integer' },
          uncoveredDays: { type: 'array', items: { type: 'string' } },
          assignments: {
            type: 'array',
            items: {
              type: 'object',
              required: ['doctorId', 'periodId', 'dayId'],
              properties: {
                doctorId: { type: 'string' },
                periodId: { type: 'string' },
                dayId: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Healthcheck',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/auth/dev/token': {
      post: {
        tags: ['auth'],
        summary: 'Emitir JWT para desarrollo',
        description: 'Disponible solo cuando AUTH_DEV_TOKEN_ENABLED=true.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'role'],
                properties: {
                  userId: { type: 'string' },
                  role: { type: 'string', enum: ['doctor', 'planner'] },
                  expiresInSeconds: { type: 'integer', minimum: 1, maximum: 43200 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Token emitido' },
          '400': { description: 'Payload invalido', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Deshabilitado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '422': { description: 'Modo auth incompatible', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/doctors': {
      get: {
        tags: ['doctors'],
        summary: 'Listar medicos',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Lista de medicos' }, '401': { description: 'No autorizado' }, '403': { description: 'Forbidden' } },
      },
      post: {
        tags: ['doctors'],
        summary: 'Crear medico',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Creado' }, '400': { description: 'Payload invalido' } },
      },
    },
    '/doctors/{doctorId}': {
      get: {
        tags: ['doctors'],
        summary: 'Obtener medico',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Medico', content: { 'application/json': { schema: { $ref: '#/components/schemas/Doctor' } } } } },
      },
      patch: {
        tags: ['doctors'],
        summary: 'Actualizar medico',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Actualizado' } },
      },
      delete: {
        tags: ['doctors'],
        summary: 'Eliminar medico',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Eliminado' } },
      },
    },
    '/periods': {
      get: {
        tags: ['periods'],
        summary: 'Listar periodos',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Lista de periodos' } },
      },
      post: {
        tags: ['periods'],
        summary: 'Crear periodo',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Creado' } },
      },
    },
    '/periods/{periodId}': {
      get: {
        tags: ['periods'],
        summary: 'Obtener periodo',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'periodId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Periodo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Period' } } } } },
      },
      patch: {
        tags: ['periods'],
        summary: 'Actualizar periodo',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'periodId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Actualizado' } },
      },
      delete: {
        tags: ['periods'],
        summary: 'Eliminar periodo',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'periodId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Eliminado' } },
      },
    },
    '/periods/{periodId}/demands': {
      put: {
        tags: ['periods'],
        summary: 'Reemplazar demandas diarias del periodo',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'periodId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Demandas actualizadas' } },
      },
    },
    '/schedule/solve': {
      post: {
        tags: ['schedule'],
        summary: 'Resolver escenario puntual',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '200': {
            description: 'Resultado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SolveResponse' } } },
          },
        },
      },
    },
    '/sprints': {
      get: {
        tags: ['sprints'],
        summary: 'Listar sprints',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Lista de sprints' } },
      },
      post: {
        tags: ['sprints'],
        summary: 'Crear sprint',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Sprint creado' } },
      },
    },
    '/sprints/{sprintId}': {
      get: {
        tags: ['sprints'],
        summary: 'Obtener sprint',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Sprint', content: { 'application/json': { schema: { $ref: '#/components/schemas/Sprint' } } } } },
      },
    },
    '/sprints/{sprintId}/global-config': {
      patch: {
        tags: ['sprints'],
        summary: 'Actualizar configuracion global de sprint',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Sprint actualizado' } },
      },
    },
    '/sprints/{sprintId}/doctors': {
      post: {
        tags: ['sprints'],
        summary: 'Agregar medico a sprint',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Sprint actualizado' } },
      },
    },
    '/sprints/{sprintId}/doctors/{doctorId}': {
      delete: {
        tags: ['sprints'],
        summary: 'Quitar medico de sprint',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Sprint actualizado' } },
      },
    },
    '/sprints/{sprintId}/availability': {
      get: {
        tags: ['availability'],
        summary: 'Listar disponibilidad cargada del sprint',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Disponibilidad' } },
      },
    },
    '/sprints/{sprintId}/doctors/{doctorId}/availability': {
      put: {
        tags: ['availability'],
        summary: 'Autogestion de disponibilidad del medico',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Disponibilidad actualizada' } },
      },
    },
    '/sprints/{sprintId}/availability/override': {
      put: {
        tags: ['availability'],
        summary: 'Override de disponibilidad por planner',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Disponibilidad actualizada' } },
      },
    },
    '/sprints/{sprintId}/status': {
      patch: {
        tags: ['runs'],
        summary: 'Marcar sprint ready-to-solve',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Estado actualizado' } },
      },
    },
    '/sprints/{sprintId}/runs': {
      post: {
        tags: ['runs'],
        summary: 'Ejecutar solver para sprint',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Corrida creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/SprintRun' } } } } },
      },
      get: {
        tags: ['runs'],
        summary: 'Historial de corridas por sprint',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Listado de corridas' } },
      },
    },
  },
} as const;
