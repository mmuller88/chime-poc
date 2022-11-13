/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getTranslationMessage = /* GraphQL */ `
  query GetTranslationMessage(
    $translationQueue: TranslationQueue!
    $createdAt: AWSDateTime!
  ) {
    getTranslationMessage(
      translationQueue: $translationQueue
      createdAt: $createdAt
    ) {
      id
      translationQueue
      createdAt
      client {
        name
        email
        phone
      }
      username
      updatedAt
    }
  }
`;
export const listTranslationMessages = /* GraphQL */ `
  query ListTranslationMessages(
    $translationQueue: TranslationQueue
    $createdAt: ModelStringKeyConditionInput
    $filter: ModelTranslationMessageFilterInput
    $limit: Int
    $nextToken: String
    $sortDirection: ModelSortDirection
  ) {
    listTranslationMessages(
      translationQueue: $translationQueue
      createdAt: $createdAt
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      sortDirection: $sortDirection
    ) {
      items {
        id
        translationQueue
        createdAt
        client {
          name
          email
          phone
        }
        username
        updatedAt
      }
      nextToken
    }
  }
`;
