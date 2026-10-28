export type FormElementType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'heading'
  | 'paragraph';

export interface FormElementOption {
  label: string;
  value: string;
}

export interface FormElementValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customError?: string;
}

export interface FormElement {
  id: string;
  type: FormElementType;
  label: string;
  placeholder?: string;
  helperText?: string;
  defaultValue?: unknown;
  options?: FormElementOption[];
  validation?: FormElementValidation;
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  elements: FormElement[];
  submitButtonText: string;
  createdAt: string;
  updatedAt: string;
}
