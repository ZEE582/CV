const mongoose = require('mongoose');

const technologySchema = new mongoose.Schema(
  {
    icon: {
      type: String,
      default: ''
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    emoji: {
      type: String,
      default: ''
    }
  },
  {
    _id: false
  }
);

const companySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    company_logo: {
      type: String,
      default: '',
      trim: true
    },

    company_name: {
      type: String,
      required: true,
      trim: true
    },

    tech_stack: {
      backend: {
        type: [technologySchema],
        default: []
      },

      frontend: {
        type: [technologySchema],
        default: []
      },

      mobile: {
        type: [technologySchema],
        default: []
      },

      database: {
        type: [technologySchema],
        default: []
      },

      devops: {
        type: [technologySchema],
        default: []
      },

      programming_languages: {
        type: [technologySchema],
        default: []
      },

      analytics: {
        type: [technologySchema],
        default: []
      }
    },

    website: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true,
    tableName: 'companies'
  }
);

module.exports = mongoose.model('Company', companySchema, 'companies');