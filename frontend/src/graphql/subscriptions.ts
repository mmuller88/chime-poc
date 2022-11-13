/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateTranslationMessage = /* GraphQL */ `
  subscription OnCreateTranslationMessage($username: String) {
    onCreateTranslationMessage(username: $username) {
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
export const onUpdateTranslationMessage = /* GraphQL */ `
  subscription OnUpdateTranslationMessage($username: String) {
    onUpdateTranslationMessage(username: $username) {
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
export const onDeleteTranslationMessage = /* GraphQL */ `
  subscription OnDeleteTranslationMessage($username: String) {
    onDeleteTranslationMessage(username: $username) {
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
