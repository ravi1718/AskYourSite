export type CreateAssistantState = {
  success: boolean;
  message: string;
  assistantId?: string;
};

export const initialCreateAssistantState: CreateAssistantState = {
  success: false,
  message: "",
};
