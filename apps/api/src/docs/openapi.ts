const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const jsonContent = (schemaName: string) => ({
  'application/json': {
    schema: ref(schemaName),
  },
});

const errorResponses = {
  BadRequest: {
    description: 'Invalid request',
    content: jsonContent('ErrorResponse'),
  },
  Unauthorized: {
    description: 'Missing/invalid JWT',
    content: jsonContent('ErrorResponse'),
  },
  Forbidden: {
    description: 'Forbidden for actor role',
    content: jsonContent('ErrorResponse'),
  },
  NotFound: {
    description: 'Resource not found',
    content: jsonContent('ErrorResponse'),
  },
  Conflict: {
    description: 'Resource conflict',
    content: jsonContent('ErrorResponse'),
  },
  Unprocessable: {
    description: 'Business rule violation',
    content: jsonContent('ErrorResponse'),
  },
  TooManyRequests: {
    description: 'Rate limited',
    content: jsonContent('ErrorResponse'),
  },
  InternalServerError: {
    description: 'Unexpected server error',
    content: jsonContent('ErrorResponse'),
  },
} as const;

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
    { name: 'planning-cycles' },
    { name: 'availability' },
    { name: 'runs' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          "OIDC JWT emitted by external IdP. Required claims: 'sub' and role claim resolvable to doctor/planner (defaults: role, roles, realm_access.roles).",
      },
    },
    responses: errorResponses,
    schemas: {
      ErrorIssue: {
        type: 'object',
        required: ['path', 'message'],
        properties: {
          path: { type: 'string' },
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          requestId: { type: 'string' },
          details: { type: 'array', items: { type: 'string' } },
          issues: { type: 'array', items: ref('ErrorIssue') },
        },
      },

      HealthResponse: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['ok'] },
        },
      },

      DevTokenRequest: {
        type: 'object',
        required: ['userId', 'role'],
        properties: {
          userId: { type: 'string', minLength: 1 },
          role: { type: 'string', enum: ['doctor', 'planner'] },
          expiresInSeconds: { type: 'integer', minimum: 1, maximum: 43200 },
        },
      },
      DevTokenResponse: {
        type: 'object',
        required: ['accessToken', 'tokenType', 'expiresInSeconds', 'issuer', 'audience'],
        properties: {
          accessToken: { type: 'string' },
          tokenType: { type: 'string', enum: ['Bearer'] },
          expiresInSeconds: { type: 'integer' },
          issuer: { type: 'string' },
          audience: { type: 'string' },
        },
      },

      Doctor: {
        type: 'object',
        required: ['id', 'name', 'active', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          active: { type: 'boolean' },
          maxTotalDaysDefault: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DoctorListResponse: {
        type: 'object',
        required: ['items'],
        properties: {
          items: { type: 'array', items: ref('Doctor') },
        },
      },
      CreateDoctorRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1 },
          active: { type: 'boolean' },
          maxTotalDaysDefault: { type: 'integer', minimum: 1 },
        },
      },
      UpdateDoctorRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 1 },
          active: { type: 'boolean' },
          maxTotalDaysDefault: { type: 'integer', minimum: 1 },
        },
      },

      PeriodDemand: {
        type: 'object',
        required: ['dayId', 'requiredDoctors'],
        properties: {
          dayId: { type: 'string', format: 'date' },
          requiredDoctors: { type: 'integer', minimum: 1 },
        },
      },
      Period: {
        type: 'object',
        required: ['id', 'name', 'startsOn', 'endsOn', 'demands', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          startsOn: { type: 'string', format: 'date' },
          endsOn: { type: 'string', format: 'date' },
          demands: { type: 'array', items: ref('PeriodDemand') },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PeriodListResponse: {
        type: 'object',
        required: ['items'],
        properties: {
          items: { type: 'array', items: ref('Period') },
        },
      },
      CreatePeriodRequest: {
        type: 'object',
        required: ['name', 'startsOn', 'endsOn'],
        properties: {
          name: { type: 'string', minLength: 1 },
          startsOn: { type: 'string', format: 'date' },
          endsOn: { type: 'string', format: 'date' },
          demands: { type: 'array', items: ref('PeriodDemand') },
        },
      },
      UpdatePeriodRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 1 },
          startsOn: { type: 'string', format: 'date' },
          endsOn: { type: 'string', format: 'date' },
        },
      },
      ReplacePeriodDemandsRequest: {
        type: 'object',
        required: ['demands'],
        properties: {
          demands: { type: 'array', items: ref('PeriodDemand') },
        },
      },

      SolveDoctor: {
        type: 'object',
        required: ['id', 'maxTotalDays'],
        properties: {
          id: { type: 'string', minLength: 1 },
          maxTotalDays: { type: 'integer', minimum: 0 },
        },
      },
      SolvePeriod: {
        type: 'object',
        required: ['id', 'dayIds'],
        properties: {
          id: { type: 'string', minLength: 1 },
          dayIds: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
        },
      },
      SolveAvailability: {
        type: 'object',
        required: ['doctorId', 'periodId', 'dayId'],
        properties: {
          doctorId: { type: 'string', minLength: 1 },
          periodId: { type: 'string', minLength: 1 },
          dayId: { type: 'string', minLength: 1 },
        },
      },
      SolveRequest: {
        type: 'object',
        required: ['contractVersion', 'doctors', 'periods', 'demands', 'availability'],
        properties: {
          contractVersion: { type: 'string', enum: ['1.0'] },
          doctors: { type: 'array', items: ref('SolveDoctor') },
          periods: { type: 'array', items: ref('SolvePeriod') },
          demands: { type: 'array', items: ref('PeriodDemand') },
          availability: { type: 'array', items: ref('SolveAvailability') },
        },
      },
      SolveAssignment: {
        type: 'object',
        required: ['doctorId', 'periodId', 'dayId'],
        properties: {
          doctorId: { type: 'string' },
          periodId: { type: 'string' },
          dayId: { type: 'string' },
        },
      },
      MinCutEdge: {
        type: 'object',
        required: ['from', 'to', 'capacity'],
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          capacity: { type: 'integer', minimum: 0 },
        },
      },
      MinCut: {
        type: 'object',
        required: ['value', 'reachableNodes', 'cutEdges'],
        properties: {
          value: { type: 'integer', minimum: 0 },
          reachableNodes: { type: 'array', items: { type: 'string' } },
          cutEdges: { type: 'array', items: ref('MinCutEdge') },
        },
      },
      SolveResponse: {
        type: 'object',
        required: ['contractVersion', 'isFeasible', 'assignedCount', 'uncoveredDays', 'assignments'],
        properties: {
          contractVersion: { type: 'string', enum: ['1.0'] },
          isFeasible: { type: 'boolean' },
          assignedCount: { type: 'integer', minimum: 0 },
          uncoveredDays: { type: 'array', items: { type: 'string' } },
          assignments: { type: 'array', items: ref('SolveAssignment') },
          minCut: ref('MinCut'),
        },
      },

      SprintGlobalConfig: {
        type: 'object',
        required: ['requiredDoctorsPerShift', 'maxDaysPerDoctorDefault'],
        properties: {
          requiredDoctorsPerShift: { type: 'integer', minimum: 1 },
          maxDaysPerDoctorDefault: { type: 'integer', minimum: 1 },
        },
      },
      AvailabilityDay: {
        type: 'object',
        required: ['periodId', 'dayId'],
        properties: {
          periodId: { type: 'string', minLength: 1 },
          dayId: { type: 'string', minLength: 1 },
        },
      },
      SprintAvailabilityEntry: {
        type: 'object',
        required: ['doctorId', 'periodId', 'dayId', 'source', 'updatedByUserId', 'updatedByRole', 'updatedAt'],
        properties: {
          doctorId: { type: 'string' },
          periodId: { type: 'string' },
          dayId: { type: 'string' },
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
          globalConfig: ref('SprintGlobalConfig'),
          doctorIds: { type: 'array', items: { type: 'string' } },
          availability: { type: 'array', items: ref('SprintAvailabilityEntry') },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      SprintListResponse: {
        type: 'object',
        required: ['items'],
        properties: {
          items: { type: 'array', items: ref('Sprint') },
          nextCursor: { type: 'string', format: 'date-time' },
        },
      },
      CreateSprintRequest: {
        type: 'object',
        required: ['name', 'periodId', 'globalConfig'],
        properties: {
          name: { type: 'string', minLength: 1 },
          periodId: { type: 'string', minLength: 1 },
          globalConfig: ref('SprintGlobalConfig'),
          doctorIds: { type: 'array', items: { type: 'string', minLength: 1 } },
        },
      },
      UpdateSprintGlobalConfigRequest: {
        type: 'object',
        required: ['globalConfig'],
        properties: {
          globalConfig: ref('SprintGlobalConfig'),
        },
      },
      AddSprintDoctorRequest: {
        type: 'object',
        required: ['doctorId'],
        properties: {
          doctorId: { type: 'string', minLength: 1 },
        },
      },
      SetDoctorAvailabilityRequest: {
        type: 'object',
        required: ['availability'],
        properties: {
          availability: { type: 'array', items: ref('AvailabilityDay') },
        },
      },
      PlannerOverrideAvailabilityRequest: {
        type: 'object',
        required: ['doctorId', 'availability'],
        properties: {
          doctorId: { type: 'string', minLength: 1 },
          availability: { type: 'array', items: ref('AvailabilityDay') },
        },
      },
      SprintAvailabilityListResponse: {
        type: 'object',
        required: ['items'],
        properties: {
          items: { type: 'array', items: ref('SprintAvailabilityEntry') },
        },
      },
      MarkSprintReadyRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['ready-to-solve'] },
        },
      },
      RunSprintSolveRequest: {
        type: 'object',
        additionalProperties: false,
      },
      SprintRunError: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
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
          inputSnapshot: ref('SolveRequest'),
          outputSnapshot: ref('SolveResponse'),
          error: ref('SprintRunError'),
        },
      },
      SprintRunListResponse: {
        type: 'object',
        required: ['items'],
        properties: {
          items: { type: 'array', items: ref('SprintRun') },
          nextCursor: { type: 'string', format: 'date-time' },
        },
      },
      PlanningCycle: {
        type: 'object',
        required: ['id', 'name', 'status', 'sprintIds', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['draft'] },
          sprintIds: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PlanningCycleListResponse: {
        type: 'object',
        required: ['items'],
        properties: {
          items: { type: 'array', items: ref('PlanningCycle') },
          nextCursor: { type: 'string', format: 'date-time' },
        },
      },
      CreatePlanningCycleRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1 },
        },
      },
      AddPlanningCycleSprintRequest: {
        type: 'object',
        required: ['sprintId'],
        properties: {
          sprintId: { type: 'string', minLength: 1 },
          orderIndex: { type: 'integer', minimum: 1 },
        },
      },
      PlanningCycleRunItem: {
        type: 'object',
        required: ['sprintId', 'executedAt', 'status'],
        properties: {
          sprintId: { type: 'string' },
          executedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['succeeded', 'failed'] },
          inputSnapshot: ref('SolveRequest'),
          outputSnapshot: ref('SolveResponse'),
          error: ref('SprintRunError'),
        },
      },
      PlanningCycleRun: {
        type: 'object',
        required: ['id', 'cycleId', 'executedAt', 'status', 'items'],
        properties: {
          id: { type: 'string' },
          cycleId: { type: 'string' },
          executedAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['succeeded', 'partial-failed', 'failed'] },
          items: { type: 'array', items: ref('PlanningCycleRunItem') },
        },
      },
      PlanningCycleRunListResponse: {
        type: 'object',
        required: ['items'],
        properties: {
          items: { type: 'array', items: ref('PlanningCycleRun') },
          nextCursor: { type: 'string', format: 'date-time' },
        },
      },
      RunPlanningCycleRequest: {
        type: 'object',
        additionalProperties: false,
      },
      RunSprintSolveResponse: {
        type: 'object',
        required: ['run', 'result'],
        properties: {
          run: ref('SprintRun'),
          result: ref('SolveResponse'),
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['health'],
        summary: 'Healthcheck',
        responses: {
          '200': { description: 'OK', content: jsonContent('HealthResponse') },
        },
      },
    },
    '/openapi.json': {
      get: {
        tags: ['health'],
        summary: 'OpenAPI document',
        responses: {
          '200': { description: 'OpenAPI JSON' },
        },
      },
    },
    '/auth/dev/token': {
      post: {
        tags: ['auth'],
        summary: 'Emitir JWT para desarrollo',
        description:
          'Disponible solo en entornos no-productivos cuando AUTH_DEV_TOKEN_ENABLED=true y JWT_SECRET configurado.',
        requestBody: {
          required: true,
          content: jsonContent('DevTokenRequest'),
        },
        responses: {
          '201': { description: 'Token emitido', content: jsonContent('DevTokenResponse') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/Unprocessable' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },

    '/doctors': {
      get: {
        tags: ['doctors'],
        summary: 'Listar medicos',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de medicos', content: jsonContent('DoctorListResponse') },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['doctors'],
        summary: 'Crear medico',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: jsonContent('CreateDoctorRequest'),
        },
        responses: {
          '201': { description: 'Medico creado', content: jsonContent('Doctor') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/doctors/{doctorId}': {
      get: {
        tags: ['doctors'],
        summary: 'Obtener medico por id',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Medico', content: jsonContent('Doctor') },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['doctors'],
        summary: 'Actualizar medico',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: jsonContent('UpdateDoctorRequest'),
        },
        responses: {
          '200': { description: 'Medico actualizado', content: jsonContent('Doctor') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['doctors'],
        summary: 'Eliminar medico',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Medico eliminado' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/periods': {
      get: {
        tags: ['periods'],
        summary: 'Listar periodos',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de periodos', content: jsonContent('PeriodListResponse') },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['periods'],
        summary: 'Crear periodo',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: jsonContent('CreatePeriodRequest'),
        },
        responses: {
          '201': { description: 'Periodo creado', content: jsonContent('Period') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/periods/{periodId}': {
      get: {
        tags: ['periods'],
        summary: 'Obtener periodo por id',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'periodId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Periodo', content: jsonContent('Period') },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['periods'],
        summary: 'Actualizar periodo',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'periodId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: jsonContent('UpdatePeriodRequest'),
        },
        responses: {
          '200': { description: 'Periodo actualizado', content: jsonContent('Period') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/Unprocessable' },
        },
      },
      delete: {
        tags: ['periods'],
        summary: 'Eliminar periodo',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'periodId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '204': { description: 'Periodo eliminado' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/periods/{periodId}/demands': {
      put: {
        tags: ['periods'],
        summary: 'Reemplazar demandas diarias del periodo',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'periodId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: jsonContent('ReplacePeriodDemandsRequest'),
        },
        responses: {
          '200': { description: 'Demandas actualizadas', content: jsonContent('Period') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/schedule/solve': {
      post: {
        tags: ['schedule'],
        summary: 'Resolver escenario puntual (endpoint tecnico transicional)',
        description:
          'Para MVP, el flujo recomendado es sprint-first: marcar ready-to-solve y ejecutar POST /sprints/{sprintId}/runs. Este endpoint se mantiene por compatibilidad tecnica.',
        deprecated: true,
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: jsonContent('SolveRequest'),
        },
        responses: {
          '200': { description: 'Resultado del solver', content: jsonContent('SolveResponse') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '422': { $ref: '#/components/responses/Unprocessable' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },

    '/sprints': {
      get: {
        tags: ['sprints'],
        summary: 'Listar sprints',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'cursor', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: {
          '200': { description: 'Lista de sprints', content: jsonContent('SprintListResponse') },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['sprints'],
        summary: 'Crear sprint',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: jsonContent('CreateSprintRequest'),
        },
        responses: {
          '201': { description: 'Sprint creado', content: jsonContent('Sprint') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/sprints/{sprintId}': {
      get: {
        tags: ['sprints'],
        summary: 'Obtener sprint por id',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Sprint', content: jsonContent('Sprint') },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/sprints/{sprintId}/global-config': {
      patch: {
        tags: ['sprints'],
        summary: 'Actualizar configuracion global del sprint',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: jsonContent('UpdateSprintGlobalConfigRequest'),
        },
        responses: {
          '200': { description: 'Sprint actualizado', content: jsonContent('Sprint') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/sprints/{sprintId}/doctors': {
      post: {
        tags: ['sprints'],
        summary: 'Agregar medico a sprint',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: jsonContent('AddSprintDoctorRequest'),
        },
        responses: {
          '200': { description: 'Sprint actualizado', content: jsonContent('Sprint') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '422': { $ref: '#/components/responses/Unprocessable' },
        },
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
        responses: {
          '200': { description: 'Sprint actualizado', content: jsonContent('Sprint') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/Unprocessable' },
        },
      },
    },

    '/sprints/{sprintId}/availability': {
      get: {
        tags: ['availability'],
        summary: 'Listar disponibilidad del sprint',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Disponibilidad', content: jsonContent('SprintAvailabilityListResponse') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/sprints/{sprintId}/doctors/{doctorId}/availability': {
      put: {
        tags: ['availability'],
        summary: 'Autogestion de disponibilidad por medico',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: jsonContent('SetDoctorAvailabilityRequest'),
        },
        responses: {
          '200': { description: 'Sprint actualizado', content: jsonContent('Sprint') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/sprints/{sprintId}/availability/override': {
      put: {
        tags: ['availability'],
        summary: 'Override de disponibilidad por planner',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: jsonContent('PlannerOverrideAvailabilityRequest'),
        },
        responses: {
          '200': { description: 'Sprint actualizado', content: jsonContent('Sprint') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/sprints/{sprintId}/status': {
      patch: {
        tags: ['runs'],
        summary: 'Marcar sprint como ready-to-solve',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: jsonContent('MarkSprintReadyRequest'),
        },
        responses: {
          '200': { description: 'Sprint actualizado', content: jsonContent('Sprint') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/Unprocessable' },
        },
      },
    },
    '/sprints/{sprintId}/runs': {
      post: {
        tags: ['runs'],
        summary: 'Ejecutar solver para sprint',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: jsonContent('RunSprintSolveRequest'),
        },
        responses: {
          '200': { description: 'Corrida ejecutada', content: jsonContent('RunSprintSolveResponse') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/Unprocessable' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
      get: {
        tags: ['runs'],
        summary: 'Historial de corridas por sprint',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'cursor', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: {
          '200': { description: 'Historial de corridas', content: jsonContent('SprintRunListResponse') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/planning-cycles': {
      get: {
        tags: ['planning-cycles'],
        summary: 'Listar ciclos de planificacion',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'cursor', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: {
          '200': { description: 'Lista de ciclos', content: jsonContent('PlanningCycleListResponse') },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['planning-cycles'],
        summary: 'Crear ciclo de planificacion',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: jsonContent('CreatePlanningCycleRequest'),
        },
        responses: {
          '201': { description: 'Ciclo creado', content: jsonContent('PlanningCycle') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/planning-cycles/{cycleId}': {
      get: {
        tags: ['planning-cycles'],
        summary: 'Obtener ciclo de planificacion',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'cycleId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Ciclo', content: jsonContent('PlanningCycle') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/planning-cycles/{cycleId}/sprints': {
      post: {
        tags: ['planning-cycles'],
        summary: 'Agregar sprint a ciclo',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'cycleId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: jsonContent('AddPlanningCycleSprintRequest'),
        },
        responses: {
          '200': { description: 'Ciclo actualizado', content: jsonContent('PlanningCycle') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '422': { $ref: '#/components/responses/Unprocessable' },
        },
      },
    },
    '/planning-cycles/{cycleId}/runs': {
      post: {
        tags: ['planning-cycles'],
        summary: 'Ejecutar ciclo de planificacion',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'cycleId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: jsonContent('RunPlanningCycleRequest'),
        },
        responses: {
          '200': { description: 'Corrida de ciclo ejecutada', content: jsonContent('PlanningCycleRun') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/Unprocessable' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
      get: {
        tags: ['planning-cycles'],
        summary: 'Listar corridas de ciclo',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'cycleId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'cursor', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100 } },
        ],
        responses: {
          '200': { description: 'Historial de corridas de ciclo', content: jsonContent('PlanningCycleRunListResponse') },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
} as const;
