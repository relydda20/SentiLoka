import crypto from 'crypto';

/**
 * Generate a unique slug for a Mongoose document
 * @param {Object} options - Configuration options
 * @param {mongoose.Model} options.model - The Mongoose model to check for uniqueness
 * @param {string} options.baseString - The base string to generate slug from (e.g., name, email)
 * @param {Object} options.query - Additional query conditions for uniqueness check (e.g., { userId: xxx })
 * @param {string} options.fallback - Fallback prefix if baseString is too short (default: 'doc')
 * @param {number} options.minLength - Minimum slug length (default: 3)
 * @param {boolean} options.useRandomSuffix - Use random suffix instead of counter (default: false)
 * @param {mongoose.Types.ObjectId} options.excludeId - Exclude this document ID from uniqueness check
 * @returns {Promise<string>} - The generated unique slug
 */
async function autoSlug({
  model,
  baseString,
  query = {},
  fallback = 'doc',
  minLength = 3,
  useRandomSuffix = false,
  excludeId = null
}) {
  if (!model || !baseString) {
    throw new Error('autoSlug requires model and baseString parameters');
  }

  // Generate base slug from string
  let baseSlug = baseString
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Handle too-short slugs
  if (baseSlug.length < minLength) {
    baseSlug = `${fallback}-${baseSlug}`;
  }

  // Ensure minimum length
  if (baseSlug.length < minLength) {
    baseSlug = `${fallback}-${crypto.randomBytes(3).toString('hex')}`;
  }

  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 100;

  // Build query for uniqueness check
  const buildQuery = (testSlug) => {
    const finalQuery = { slug: testSlug, ...query };
    if (excludeId) {
      finalQuery._id = { $ne: excludeId };
    }
    return finalQuery;
  };

  // Check uniqueness and generate variations if needed
  while (attempts < maxAttempts) {
    const exists = await model.findOne(buildQuery(slug));

    if (!exists) {
      return slug;
    }

    // Generate next variation
    if (useRandomSuffix) {
      // Use random 6-character suffix
      const randomSuffix = crypto.randomBytes(3).toString('hex');
      slug = `${baseSlug}-${randomSuffix}`;
    } else {
      // Use incremental counter
      attempts++;
      slug = `${baseSlug}-${attempts}`;
    }
  }

  // Fallback to random suffix if counter exceeded
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Generate a slug from multiple possible sources
 * @param {Object} options - Configuration options
 * @param {mongoose.Model} options.model - The Mongoose model
 * @param {Array<string>} options.sources - Array of field names to try in order (e.g., ['name', 'email', 'title'])
 * @param {Object} options.doc - The document to generate slug from
 * @param {Object} options.query - Additional query conditions
 * @param {string} options.fallback - Fallback prefix
 * @param {boolean} options.useRandomSuffix - Use random suffix
 * @returns {Promise<string>} - The generated unique slug
 */
async function autoSlugFromFields({
  model,
  sources = [],
  doc,
  query = {},
  fallback = 'doc',
  useRandomSuffix = false
}) {
  if (!model || !doc || sources.length === 0) {
    throw new Error('autoSlugFromFields requires model, doc, and sources parameters');
  }

  // Find first non-empty source
  let baseString = '';
  for (const field of sources) {
    const value = doc[field];
    if (value && typeof value === 'string' && value.trim().length > 0) {
      baseString = value;
      break;
    }
  }

  // Fallback to random if no valid source found
  if (!baseString) {
    baseString = crypto.randomBytes(4).toString('hex');
  }

  return autoSlug({
    model,
    baseString,
    query,
    fallback,
    useRandomSuffix,
    excludeId: doc._id
  });
}

/**
 * Mongoose plugin to automatically generate slugs
 * @param {mongoose.Schema} schema - The schema to add slug generation to
 * @param {Object} options - Plugin options
 * @param {string|Array<string>} options.source - Field(s) to generate slug from (default: 'name')
 * @param {string} options.field - The field name to store slug in (default: 'slug')
 * @param {boolean} options.unique - Add unique index on slug field (default: true)
 * @param {string} options.fallback - Fallback prefix (default: 'doc')
 * @param {boolean} options.useRandomSuffix - Use random suffix (default: false)
 * @param {boolean} options.regenerateOnUpdate - Regenerate slug when source field changes (default: false)
 */
function autoSlugPlugin(schema, options = {}) {
  const {
    source = 'name',
    field = 'slug',
    unique = true,
    fallback = 'doc',
    useRandomSuffix = false,
    regenerateOnUpdate = false
  } = options;

  const sources = Array.isArray(source) ? source : [source];

  // Add slug field to schema if not exists
  if (!schema.path(field)) {
    schema.add({
      [field]: {
        type: String,
        unique,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
      }
    });
  }

  // Pre-save hook
  schema.pre('save', async function (next) {
    try {
      // Generate slug if it doesn't exist or if regenerateOnUpdate is true and source changed
      const shouldGenerate = !this[field] ||
        (regenerateOnUpdate && sources.some(src => this.isModified(src)));

      if (shouldGenerate) {
        this[field] = await autoSlugFromFields({
          model: this.constructor,
          sources,
          doc: this,
          fallback,
          useRandomSuffix
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  });

  // Add regenerate method
  schema.methods.regenerateSlug = async function () {
    this[field] = await autoSlugFromFields({
      model: this.constructor,
      sources,
      doc: this,
      fallback,
      useRandomSuffix
    });
    await this.save();
    return this[field];
  };
}

export {
  autoSlug,
  autoSlugFromFields,
  autoSlugPlugin
};
