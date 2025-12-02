export const listMyTasksQuery = /* GraphQL */ `
  query ListMyTasks {
    listMyTasks {
      owner
      taskId
      title
      status
      createdAt
    }
  }
`;

export const createTaskMutation = /* GraphQL */ `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      owner
      taskId
      title
      status
      createdAt
    }
  }
`;

export const updateTaskStatusMutation = /* GraphQL */ `
  mutation UpdateTaskStatus($input: UpdateTaskStatusInput!) {
    updateTaskStatus(input: $input) {
      owner
      taskId
      title
      status
      createdAt
    }
  }
`;

export const deleteTaskMutation = /* GraphQL */ `
  mutation DeleteTask($taskId: ID!) {
    deleteTask(taskId: $taskId)
  }
`;
