/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getTranslationMessage = /* GraphQL */ `
  query GetTranslationMessage($id: ID!) {
    getTranslationMessage(id: $id) {
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
export const listTranslationMessages = /* GraphQL */ `
  query ListTranslationMessages(
    $filter: ModelTranslationMessageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTranslationMessages(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
    }
  }
`;
