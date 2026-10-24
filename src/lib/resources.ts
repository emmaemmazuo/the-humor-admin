export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'uuid'

export type Field = {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: { table: string; value: string; label: string }
}

export type Column = {
  name: string
  label: string
  kind?: 'text' | 'long' | 'bool' | 'date' | 'image' | 'id'
  lookup?: { table: string; label: string }
}

export type Resource = {
  slug: string
  group: string
  title: string
  description: string
  table: string
  columns: Column[]
  fields: Field[]
  can: { create: boolean; update: boolean; delete: boolean }
  orderBy: string
  ascending?: boolean
  search?: string
  big?: boolean
}

const created: Column = { name: 'created_datetime_utc', label: 'Created', kind: 'date' }
const idCol: Column = { name: 'id', label: 'ID', kind: 'id' }
const READ = { create: false, update: false, delete: false }
const CRUD = { create: true, update: true, delete: true }

export const resources: Resource[] = [
  {
    slug: 'prompt-chains',
    group: 'Prompt chains',
    title: 'Prompt chains (humor flavors)',
    description: 'Each humor flavor is the definition of a prompt chain.',
    table: 'humor_flavors',
    columns: [
      idCol,
      { name: 'slug', label: 'Slug' },
      { name: 'description', label: 'Description', kind: 'long' },
      { name: 'is_pinned', label: 'Pinned', kind: 'bool' },
      created,
    ],
    fields: [],
    can: READ,
    orderBy: 'id',
    ascending: false,
    search: 'slug',
  },
  {
    slug: 'prompt-chain-steps',
    group: 'Prompt chains',
    title: 'Prompt chain steps',
    description: 'The ordered steps inside each prompt chain.',
    table: 'humor_flavor_steps',
    columns: [
      idCol,
      { name: 'humor_flavor_id', label: 'Chain', lookup: { table: 'humor_flavors', label: 'slug' } },
      { name: 'order_by', label: 'Step #' },
      { name: 'description', label: 'Description' },
      { name: 'humor_flavor_step_type_id', label: 'Type', lookup: { table: 'humor_flavor_step_types', label: 'slug' } },
      { name: 'llm_model_id', label: 'Model', lookup: { table: 'llm_models', label: 'name' } },
      { name: 'llm_temperature', label: 'Temp' },
      { name: 'llm_system_prompt', label: 'System prompt', kind: 'long' },
      { name: 'llm_user_prompt', label: 'User prompt', kind: 'long' },
      { name: 'is_hidden', label: 'Hidden', kind: 'bool' },
    ],
    fields: [],
    can: READ,
    orderBy: 'id',
    ascending: false,
  },
  {
    slug: 'prompt-chain-runs',
    group: 'Prompt chains',
    title: 'Prompt chain runs',
    description: 'A log of each time a chain was run for a caption request.',
    table: 'llm_prompt_chains',
    columns: [idCol, { name: 'caption_request_id', label: 'Caption request' }, created],
    fields: [],
    can: READ,
    orderBy: 'id',
    ascending: false,
    big: true,
  },
  {
    slug: 'prompt-chain-mix',
    group: 'Prompt chains',
    title: 'Prompt chain mix',
    description: 'How many captions each chain contributes. You can update the caption count.',
    table: 'humor_flavor_mix',
    columns: [
      idCol,
      { name: 'humor_flavor_id', label: 'Chain', lookup: { table: 'humor_flavors', label: 'slug' } },
      { name: 'caption_count', label: 'Caption count' },
      created,
    ],
    fields: [{ name: 'caption_count', label: 'Caption count', type: 'number', required: true }],
    can: { create: false, update: true, delete: false },
    orderBy: 'id',
  },
  {
    slug: 'media-captions',
    group: 'AI-generated media',
    title: 'AI-generated captions',
    description: 'Captions with the image each one was written for.',
    table: 'captions',
    columns: [
      idCol,
      { name: 'image_id', label: 'Image', kind: 'image', lookup: { table: 'images', label: 'url' } },
      { name: 'content', label: 'Caption', kind: 'long' },
      { name: 'humor_flavor_id', label: 'Chain', lookup: { table: 'humor_flavors', label: 'slug' } },
      { name: 'is_public', label: 'Public', kind: 'bool' },
      { name: 'is_featured', label: 'Featured', kind: 'bool' },
      { name: 'like_count', label: 'Likes' },
      created,
    ],
    fields: [],
    can: READ,
    orderBy: 'created_datetime_utc',
    ascending: false,
    search: 'content',
    big: true,
  },
  {
    slug: 'media-images',
    group: 'AI-generated media',
    title: 'Images',
    description: 'The images that captions are written for.',
    table: 'images',
    columns: [
      idCol,
      { name: 'url', label: 'Image', kind: 'image' },
      { name: 'image_description', label: 'Description', kind: 'long' },
      { name: 'is_public', label: 'Public', kind: 'bool' },
      { name: 'is_common_use', label: 'Common use', kind: 'bool' },
      created,
    ],
    fields: [],
    can: READ,
    orderBy: 'created_datetime_utc',
    ascending: false,
    search: 'image_description',
    big: true,
  },
  {
    slug: 'generation-requests',
    group: 'AI-generated media',
    title: 'Generation requests',
    description: 'Each request to generate captions for an image.',
    table: 'caption_requests',
    columns: [
      idCol,
      { name: 'image_id', label: 'Image', kind: 'image', lookup: { table: 'images', label: 'url' } },
      { name: 'profile_id', label: 'Requested by', kind: 'id' },
      created,
    ],
    fields: [],
    can: READ,
    orderBy: 'id',
    ascending: false,
    big: true,
  },
  {
    slug: 'generation-examples',
    group: 'AI-generated media',
    title: 'Generation examples',
    description: 'Example captions used to guide generation.',
    table: 'caption_examples',
    columns: [
      idCol,
      { name: 'image_id', label: 'Image', kind: 'image', lookup: { table: 'images', label: 'url' } },
      { name: 'caption', label: 'Caption', kind: 'long' },
      { name: 'image_description', label: 'Image description', kind: 'long' },
      { name: 'explanation', label: 'Explanation', kind: 'long' },
      { name: 'priority', label: 'Priority' },
      { name: 'caption_example_category_id', label: 'Category', lookup: { table: 'caption_example_categories', label: 'name' } },
      created,
    ],
    fields: [
      { name: 'caption', label: 'Caption', type: 'textarea', required: true },
      { name: 'image_description', label: 'Image description', type: 'textarea' },
      { name: 'explanation', label: 'Explanation', type: 'textarea' },
      { name: 'priority', label: 'Priority', type: 'number' },
      { name: 'image_id', label: 'Image ID (UUID, optional)', type: 'uuid' },
      {
        name: 'caption_example_category_id',
        label: 'Category',
        type: 'select',
        options: { table: 'caption_example_categories', value: 'id', label: 'name' },
      },
    ],
    can: CRUD,
    orderBy: 'id',
    ascending: false,
    search: 'caption',
  },
  {
    slug: 'llm-providers',
    group: 'LLM',
    title: 'LLM providers',
    description: 'Companies that supply language models.',
    table: 'llm_providers',
    columns: [idCol, { name: 'name', label: 'Name' }, created],
    fields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
    can: CRUD,
    orderBy: 'id',
  },
  {
    slug: 'llm-models',
    group: 'LLM',
    title: 'LLM models',
    description: 'Language models available to prompt chain steps.',
    table: 'llm_models',
    columns: [
      idCol,
      { name: 'name', label: 'Name' },
      { name: 'llm_provider_id', label: 'Provider', lookup: { table: 'llm_providers', label: 'name' } },
      { name: 'provider_model_id', label: 'Provider model ID' },
      { name: 'is_temperature_supported', label: 'Temperature', kind: 'bool' },
      created,
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      {
        name: 'llm_provider_id',
        label: 'Provider',
        type: 'select',
        required: true,
        options: { table: 'llm_providers', value: 'id', label: 'name' },
      },
      { name: 'provider_model_id', label: 'Provider model ID', type: 'text', required: true },
      { name: 'is_temperature_supported', label: 'Temperature supported', type: 'boolean' },
    ],
    can: CRUD,
    orderBy: 'id',
    search: 'name',
  },
  {
    slug: 'llm-responses',
    group: 'LLM',
    title: 'LLM responses',
    description: 'Every response a model returned, with the prompt that produced it.',
    table: 'llm_model_responses',
    columns: [
      idCol,
      { name: 'llm_model_id', label: 'Model', lookup: { table: 'llm_models', label: 'name' } },
      { name: 'humor_flavor_id', label: 'Chain', lookup: { table: 'humor_flavors', label: 'slug' } },
      { name: 'processing_time_seconds', label: 'Seconds' },
      { name: 'llm_temperature', label: 'Temp' },
      { name: 'llm_user_prompt', label: 'User prompt', kind: 'long' },
      { name: 'llm_model_response', label: 'Response', kind: 'long' },
      created,
    ],
    fields: [],
    can: READ,
    orderBy: 'created_datetime_utc',
    ascending: false,
    big: true,
  },
  {
    slug: 'terms',
    group: 'Reference and access',
    title: 'Terms',
    description: 'The glossary of humor terms.',
    table: 'terms',
    columns: [
      idCol,
      { name: 'term', label: 'Term' },
      { name: 'definition', label: 'Definition', kind: 'long' },
      { name: 'example', label: 'Example', kind: 'long' },
      { name: 'priority', label: 'Priority' },
      { name: 'term_type_id', label: 'Type', lookup: { table: 'term_types', label: 'name' } },
      created,
    ],
    fields: [
      { name: 'term', label: 'Term', type: 'text', required: true },
      { name: 'definition', label: 'Definition', type: 'textarea', required: true },
      { name: 'example', label: 'Example', type: 'textarea' },
      { name: 'priority', label: 'Priority', type: 'number' },
      {
        name: 'term_type_id',
        label: 'Type',
        type: 'select',
        options: { table: 'term_types', value: 'id', label: 'name' },
      },
    ],
    can: CRUD,
    orderBy: 'id',
    ascending: false,
    search: 'term',
  },
  {
    slug: 'signup-domains',
    group: 'Reference and access',
    title: 'Allowed signup domains',
    description: 'Email domains that are allowed to sign up.',
    table: 'allowed_signup_domains',
    columns: [idCol, { name: 'apex_domain', label: 'Domain' }, created],
    fields: [{ name: 'apex_domain', label: 'Domain (e.g. columbia.edu)', type: 'text', required: true }],
    can: CRUD,
    orderBy: 'id',
    ascending: false,
    search: 'apex_domain',
  },
  {
    slug: 'whitelist-emails',
    group: 'Reference and access',
    title: 'Whitelisted email addresses',
    description: 'Individual email addresses that are allowed to sign up.',
    table: 'whitelist_email_addresses',
    columns: [idCol, { name: 'email_address', label: 'Email' }, created],
    fields: [{ name: 'email_address', label: 'Email address', type: 'text', required: true }],
    can: CRUD,
    orderBy: 'id',
    ascending: false,
    search: 'email_address',
  },
  {
    slug: 'course-users',
    group: 'Users',
    title: 'Course users',
    description: 'Profiles in the course database (names and emails are anonymized).',
    table: 'profiles',
    columns: [
      idCol,
      { name: 'email', label: 'Email' },
      { name: 'first_name', label: 'First name' },
      { name: 'last_name', label: 'Last name' },
      { name: 'is_superadmin', label: 'Superadmin', kind: 'bool' },
      { name: 'is_matrix_admin', label: 'Matrix admin', kind: 'bool' },
      created,
    ],
    fields: [],
    can: READ,
    orderBy: 'created_datetime_utc',
    ascending: false,
    search: 'email',
    big: true,
  },
]

export function getResource(slug: string) {
  return resources.find((r) => r.slug === slug)
}
