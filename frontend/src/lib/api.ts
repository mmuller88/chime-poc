import {
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import { amplifyFetcher } from '../lib/fetcher';
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  AWSDate: string;
  AWSDateTime: string;
  AWSEmail: string;
  AWSIPAddress: string;
  AWSJSON: string;
  AWSPhone: string;
  AWSTime: string;
  AWSTimestamp: number;
  AWSURL: string;
  BigInt: any;
  Double: any;
};

export type CreateTranslationMessageInput = {
  createdAt?: InputMaybe<Scalars['AWSDateTime']>;
  id?: InputMaybe<Scalars['ID']>;
  operator: OperatorInput;
  translationQueue: TranslationQueue;
  username: Scalars['String'];
};

export type DeleteTranslationMessageInput = {
  createdAt: Scalars['AWSDateTime'];
  translationQueue: TranslationQueue;
};

export type ModelBooleanFilterInput = {
  eq?: InputMaybe<Scalars['Boolean']>;
  ne?: InputMaybe<Scalars['Boolean']>;
};

export type ModelFloatFilterInput = {
  between?: InputMaybe<Array<InputMaybe<Scalars['Float']>>>;
  eq?: InputMaybe<Scalars['Float']>;
  ge?: InputMaybe<Scalars['Float']>;
  gt?: InputMaybe<Scalars['Float']>;
  le?: InputMaybe<Scalars['Float']>;
  lt?: InputMaybe<Scalars['Float']>;
  ne?: InputMaybe<Scalars['Float']>;
};

export type ModelIdFilterInput = {
  beginsWith?: InputMaybe<Scalars['ID']>;
  between?: InputMaybe<Array<InputMaybe<Scalars['ID']>>>;
  contains?: InputMaybe<Scalars['ID']>;
  eq?: InputMaybe<Scalars['ID']>;
  ge?: InputMaybe<Scalars['ID']>;
  gt?: InputMaybe<Scalars['ID']>;
  le?: InputMaybe<Scalars['ID']>;
  lt?: InputMaybe<Scalars['ID']>;
  ne?: InputMaybe<Scalars['ID']>;
  notContains?: InputMaybe<Scalars['ID']>;
};

export type ModelIntFilterInput = {
  between?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  eq?: InputMaybe<Scalars['Int']>;
  ge?: InputMaybe<Scalars['Int']>;
  gt?: InputMaybe<Scalars['Int']>;
  le?: InputMaybe<Scalars['Int']>;
  lt?: InputMaybe<Scalars['Int']>;
  ne?: InputMaybe<Scalars['Int']>;
};

export enum ModelSortDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type ModelStringFilterInput = {
  beginsWith?: InputMaybe<Scalars['String']>;
  between?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  contains?: InputMaybe<Scalars['String']>;
  eq?: InputMaybe<Scalars['String']>;
  ge?: InputMaybe<Scalars['String']>;
  gt?: InputMaybe<Scalars['String']>;
  le?: InputMaybe<Scalars['String']>;
  lt?: InputMaybe<Scalars['String']>;
  ne?: InputMaybe<Scalars['String']>;
  notContains?: InputMaybe<Scalars['String']>;
};

export type ModelStringKeyConditionInput = {
  beginsWith?: InputMaybe<Scalars['String']>;
  between?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  eq?: InputMaybe<Scalars['String']>;
  ge?: InputMaybe<Scalars['String']>;
  gt?: InputMaybe<Scalars['String']>;
  le?: InputMaybe<Scalars['String']>;
  lt?: InputMaybe<Scalars['String']>;
};

export type ModelTranslationMessageConnection = {
  __typename?: 'ModelTranslationMessageConnection';
  items?: Maybe<Array<Maybe<TranslationMessage>>>;
  nextToken?: Maybe<Scalars['String']>;
};

export type ModelTranslationMessageFilterInput = {
  and?: InputMaybe<Array<InputMaybe<ModelTranslationMessageFilterInput>>>;
  createdAt?: InputMaybe<ModelStringFilterInput>;
  id?: InputMaybe<ModelIdFilterInput>;
  not?: InputMaybe<ModelTranslationMessageFilterInput>;
  or?: InputMaybe<Array<InputMaybe<ModelTranslationMessageFilterInput>>>;
  translationQueue?: InputMaybe<ModelTranslationQueueFilterInput>;
  username?: InputMaybe<ModelStringFilterInput>;
};

export type ModelTranslationQueueFilterInput = {
  eq?: InputMaybe<TranslationQueue>;
  ne?: InputMaybe<TranslationQueue>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createTranslationMessage?: Maybe<TranslationMessage>;
  deleteTranslationMessage?: Maybe<TranslationMessage>;
  updateTranslationMessage?: Maybe<TranslationMessage>;
};

export type MutationCreateTranslationMessageArgs = {
  input: CreateTranslationMessageInput;
};

export type MutationDeleteTranslationMessageArgs = {
  input: DeleteTranslationMessageInput;
};

export type MutationUpdateTranslationMessageArgs = {
  input: UpdateTranslationMessageInput;
};

export type Operator = {
  __typename?: 'Operator';
  email?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
};

export type OperatorInput = {
  email?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  phone?: InputMaybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  getTranslationMessage?: Maybe<TranslationMessage>;
  listTranslationMessages?: Maybe<ModelTranslationMessageConnection>;
};

export type QueryGetTranslationMessageArgs = {
  createdAt: Scalars['AWSDateTime'];
  translationQueue: TranslationQueue;
};

export type QueryListTranslationMessagesArgs = {
  createdAt?: InputMaybe<ModelStringKeyConditionInput>;
  filter?: InputMaybe<ModelTranslationMessageFilterInput>;
  limit?: InputMaybe<Scalars['Int']>;
  nextToken?: InputMaybe<Scalars['String']>;
  sortDirection?: InputMaybe<ModelSortDirection>;
  translationQueue?: InputMaybe<TranslationQueue>;
};

export type Subscription = {
  __typename?: 'Subscription';
  onCreateTranslationMessage?: Maybe<TranslationMessage>;
  onDeleteTranslationMessage?: Maybe<TranslationMessage>;
  onUpdateTranslationMessage?: Maybe<TranslationMessage>;
};

export type SubscriptionOnCreateTranslationMessageArgs = {
  username?: InputMaybe<Scalars['String']>;
};

export type SubscriptionOnDeleteTranslationMessageArgs = {
  username?: InputMaybe<Scalars['String']>;
};

export type SubscriptionOnUpdateTranslationMessageArgs = {
  username?: InputMaybe<Scalars['String']>;
};

export type TranslationMessage = {
  __typename?: 'TranslationMessage';
  createdAt: Scalars['AWSDateTime'];
  id: Scalars['ID'];
  operator: Operator;
  translationQueue: TranslationQueue;
  updatedAt: Scalars['AWSDateTime'];
  username: Scalars['String'];
};

export enum TranslationQueue {
  EngGer = 'EngGer',
  EngPt = 'EngPt',
}

export type UpdateTranslationMessageInput = {
  createdAt: Scalars['AWSDateTime'];
  id?: InputMaybe<Scalars['ID']>;
  operator?: InputMaybe<OperatorInput>;
  translationQueue: TranslationQueue;
  username?: InputMaybe<Scalars['String']>;
};

export const CreateTranslationMessageDocument = `
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
export const useCreateTranslationMessageMutation = <
  TError = unknown,
  TContext = unknown
>(
  options?: UseMutationOptions<
    CreateTranslationMessageMutation,
    TError,
    CreateTranslationMessageMutationVariables,
    TContext
  >,
) =>
  useMutation<
    CreateTranslationMessageMutation,
    TError,
    CreateTranslationMessageMutationVariables,
    TContext
  >(
    ['CreateTranslationMessage'],
    (variables?: CreateTranslationMessageMutationVariables) =>
      amplifyFetcher<
        CreateTranslationMessageMutation,
        CreateTranslationMessageMutationVariables
      >(CreateTranslationMessageDocument, variables)(),
    options,
  );
export const UpdateTranslationMessageDocument = `
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
export const useUpdateTranslationMessageMutation = <
  TError = unknown,
  TContext = unknown
>(
  options?: UseMutationOptions<
    UpdateTranslationMessageMutation,
    TError,
    UpdateTranslationMessageMutationVariables,
    TContext
  >,
) =>
  useMutation<
    UpdateTranslationMessageMutation,
    TError,
    UpdateTranslationMessageMutationVariables,
    TContext
  >(
    ['UpdateTranslationMessage'],
    (variables?: UpdateTranslationMessageMutationVariables) =>
      amplifyFetcher<
        UpdateTranslationMessageMutation,
        UpdateTranslationMessageMutationVariables
      >(UpdateTranslationMessageDocument, variables)(),
    options,
  );
export const DeleteTranslationMessageDocument = `
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
export const useDeleteTranslationMessageMutation = <
  TError = unknown,
  TContext = unknown
>(
  options?: UseMutationOptions<
    DeleteTranslationMessageMutation,
    TError,
    DeleteTranslationMessageMutationVariables,
    TContext
  >,
) =>
  useMutation<
    DeleteTranslationMessageMutation,
    TError,
    DeleteTranslationMessageMutationVariables,
    TContext
  >(
    ['DeleteTranslationMessage'],
    (variables?: DeleteTranslationMessageMutationVariables) =>
      amplifyFetcher<
        DeleteTranslationMessageMutation,
        DeleteTranslationMessageMutationVariables
      >(DeleteTranslationMessageDocument, variables)(),
    options,
  );
export const GetTranslationMessageDocument = `
    query GetTranslationMessage($translationQueue: TranslationQueue!, $createdAt: AWSDateTime!) {
  getTranslationMessage(
    translationQueue: $translationQueue
    createdAt: $createdAt
  ) {
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
export const useGetTranslationMessageQuery = <
  TData = GetTranslationMessageQuery,
  TError = unknown
>(
  variables: GetTranslationMessageQueryVariables,
  options?: UseQueryOptions<GetTranslationMessageQuery, TError, TData>,
) =>
  useQuery<GetTranslationMessageQuery, TError, TData>(
    ['GetTranslationMessage', variables],
    amplifyFetcher<
      GetTranslationMessageQuery,
      GetTranslationMessageQueryVariables
    >(GetTranslationMessageDocument, variables),
    options,
  );
export const ListTranslationMessagesDocument = `
    query ListTranslationMessages($translationQueue: TranslationQueue, $createdAt: ModelStringKeyConditionInput, $filter: ModelTranslationMessageFilterInput, $limit: Int, $nextToken: String, $sortDirection: ModelSortDirection) {
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
      operator {
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
export const useListTranslationMessagesQuery = <
  TData = ListTranslationMessagesQuery,
  TError = unknown
>(
  variables?: ListTranslationMessagesQueryVariables,
  options?: UseQueryOptions<ListTranslationMessagesQuery, TError, TData>,
) =>
  useQuery<ListTranslationMessagesQuery, TError, TData>(
    variables === undefined
      ? ['ListTranslationMessages']
      : ['ListTranslationMessages', variables],
    amplifyFetcher<
      ListTranslationMessagesQuery,
      ListTranslationMessagesQueryVariables
    >(ListTranslationMessagesDocument, variables),
    options,
  );
export const OnCreateTranslationMessageDocument = `
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
export const OnUpdateTranslationMessageDocument = `
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
export const OnDeleteTranslationMessageDocument = `
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
export type CreateTranslationMessageMutationVariables = Exact<{
  input: CreateTranslationMessageInput;
}>;

export type CreateTranslationMessageMutation = {
  __typename?: 'Mutation';
  createTranslationMessage?:
    | {
        __typename?: 'TranslationMessage';
        id: string;
        translationQueue: TranslationQueue;
        createdAt: string;
        username: string;
        updatedAt: string;
        operator: {
          __typename?: 'Operator';
          name?: string | null | undefined;
          email?: string | null | undefined;
          phone?: string | null | undefined;
        };
      }
    | null
    | undefined;
};

export type UpdateTranslationMessageMutationVariables = Exact<{
  input: UpdateTranslationMessageInput;
}>;

export type UpdateTranslationMessageMutation = {
  __typename?: 'Mutation';
  updateTranslationMessage?:
    | {
        __typename?: 'TranslationMessage';
        id: string;
        translationQueue: TranslationQueue;
        createdAt: string;
        username: string;
        updatedAt: string;
        operator: {
          __typename?: 'Operator';
          name?: string | null | undefined;
          email?: string | null | undefined;
          phone?: string | null | undefined;
        };
      }
    | null
    | undefined;
};

export type DeleteTranslationMessageMutationVariables = Exact<{
  input: DeleteTranslationMessageInput;
}>;

export type DeleteTranslationMessageMutation = {
  __typename?: 'Mutation';
  deleteTranslationMessage?:
    | {
        __typename?: 'TranslationMessage';
        id: string;
        translationQueue: TranslationQueue;
        createdAt: string;
        username: string;
        updatedAt: string;
        operator: {
          __typename?: 'Operator';
          name?: string | null | undefined;
          email?: string | null | undefined;
          phone?: string | null | undefined;
        };
      }
    | null
    | undefined;
};

export type GetTranslationMessageQueryVariables = Exact<{
  translationQueue: TranslationQueue;
  createdAt: Scalars['AWSDateTime'];
}>;

export type GetTranslationMessageQuery = {
  __typename?: 'Query';
  getTranslationMessage?:
    | {
        __typename?: 'TranslationMessage';
        id: string;
        translationQueue: TranslationQueue;
        createdAt: string;
        username: string;
        updatedAt: string;
        operator: {
          __typename?: 'Operator';
          name?: string | null | undefined;
          email?: string | null | undefined;
          phone?: string | null | undefined;
        };
      }
    | null
    | undefined;
};

export type ListTranslationMessagesQueryVariables = Exact<{
  translationQueue?: InputMaybe<TranslationQueue>;
  createdAt?: InputMaybe<ModelStringKeyConditionInput>;
  filter?: InputMaybe<ModelTranslationMessageFilterInput>;
  limit?: InputMaybe<Scalars['Int']>;
  nextToken?: InputMaybe<Scalars['String']>;
  sortDirection?: InputMaybe<ModelSortDirection>;
}>;

export type ListTranslationMessagesQuery = {
  __typename?: 'Query';
  listTranslationMessages?:
    | {
        __typename?: 'ModelTranslationMessageConnection';
        nextToken?: string | null | undefined;
        items?:
          | Array<
              | {
                  __typename?: 'TranslationMessage';
                  id: string;
                  translationQueue: TranslationQueue;
                  createdAt: string;
                  username: string;
                  updatedAt: string;
                  operator: {
                    __typename?: 'Operator';
                    name?: string | null | undefined;
                    email?: string | null | undefined;
                    phone?: string | null | undefined;
                  };
                }
              | null
              | undefined
            >
          | null
          | undefined;
      }
    | null
    | undefined;
};

export type OnCreateTranslationMessageSubscriptionVariables = Exact<{
  username?: InputMaybe<Scalars['String']>;
}>;

export type OnCreateTranslationMessageSubscription = {
  __typename?: 'Subscription';
  onCreateTranslationMessage?:
    | {
        __typename?: 'TranslationMessage';
        id: string;
        translationQueue: TranslationQueue;
        createdAt: string;
        username: string;
        updatedAt: string;
        operator: {
          __typename?: 'Operator';
          name?: string | null | undefined;
          email?: string | null | undefined;
          phone?: string | null | undefined;
        };
      }
    | null
    | undefined;
};

export type OnUpdateTranslationMessageSubscriptionVariables = Exact<{
  username?: InputMaybe<Scalars['String']>;
}>;

export type OnUpdateTranslationMessageSubscription = {
  __typename?: 'Subscription';
  onUpdateTranslationMessage?:
    | {
        __typename?: 'TranslationMessage';
        id: string;
        translationQueue: TranslationQueue;
        createdAt: string;
        username: string;
        updatedAt: string;
        operator: {
          __typename?: 'Operator';
          name?: string | null | undefined;
          email?: string | null | undefined;
          phone?: string | null | undefined;
        };
      }
    | null
    | undefined;
};

export type OnDeleteTranslationMessageSubscriptionVariables = Exact<{
  username?: InputMaybe<Scalars['String']>;
}>;

export type OnDeleteTranslationMessageSubscription = {
  __typename?: 'Subscription';
  onDeleteTranslationMessage?:
    | {
        __typename?: 'TranslationMessage';
        id: string;
        translationQueue: TranslationQueue;
        createdAt: string;
        username: string;
        updatedAt: string;
        operator: {
          __typename?: 'Operator';
          name?: string | null | undefined;
          email?: string | null | undefined;
          phone?: string | null | undefined;
        };
      }
    | null
    | undefined;
};
