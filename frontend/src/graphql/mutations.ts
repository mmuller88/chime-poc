/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createTranslationMessage = /* GraphQL */ `
  mutation CreateTranslationMessage($input: CreateTranslationMessageInput!) {
    createTranslationMessage(input: $input) {
      id
      translationQueue
      createdAt
      operator {
        name
        email
        phone
      }
      username
      updatedAt
    }
  }
`;
export const updateTranslationMessage = /* GraphQL */ `
  mutation UpdateTranslationMessage($input: UpdateTranslationMessageInput!) {
    updateTranslationMessage(input: $input) {
      id
      translationQueue
      createdAt
      operator {
        name
        email
        phone
      }
      username
      updatedAt
    }
  }
`;
export const deleteTranslationMessage = /* GraphQL */ `
  mutation DeleteTranslationMessage($input: DeleteTranslationMessageInput!) {
    deleteTranslationMessage(input: $input) {
      id
      translationQueue
      createdAt
      operator {
        name
        email
        phone
      }
      username
      updatedAt
    }
  }
`;
