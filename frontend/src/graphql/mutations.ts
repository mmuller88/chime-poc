/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createTranslationMessage = /* GraphQL */ `
  mutation CreateTranslationMessage($input: CreateTranslationMessageInput!) {
    createTranslationMessage(input: $input) {
      id
      sortKey
      interpreter {
        name
        email
        phone
      }
      username
      createdAt
      updatedAt
    }
  }
`;
export const updateTranslationMessage = /* GraphQL */ `
  mutation UpdateTranslationMessage($input: UpdateTranslationMessageInput!) {
    updateTranslationMessage(input: $input) {
      id
      sortKey
      interpreter {
        name
        email
        phone
      }
      username
      createdAt
      updatedAt
    }
  }
`;
export const deleteTranslationMessage = /* GraphQL */ `
  mutation DeleteTranslationMessage($input: DeleteTranslationMessageInput!) {
    deleteTranslationMessage(input: $input) {
      id
      sortKey
      interpreter {
        name
        email
        phone
      }
      username
      createdAt
      updatedAt
    }
  }
`;
