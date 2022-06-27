"use strict";
const boostrap = require("./bootstrap");

module.exports = {
  async bootstrap() {
    await boostrap();
  },

  register({ strapi }) {
    const extensionService = strapi.service("plugin::graphql.extension");

    // Overriding the default article GraphQL resolver
    extensionService.use(({ strapi }) => ({
      typeDefs: `
        type Query {
          article(slug: String!): ArticleEntityResponse
        }
      `,
      resolvers: {
        Query: {
          article: {
            resolve: async (parent, args, context) => {
              const { toEntityResponse } = strapi.service(
                "plugin::graphql.format"
              ).returnTypes;

              const data = await strapi.services["api::article.article"].find({
                filters: { slug: args.slug },
              });

              const response = toEntityResponse(data.results[0]);

              console.log("##################", response, "##################");

              return response;
            },
          },
        },
      },
    }));

    // Custom query resolver to get all authors and their details.
    extensionService.use(({ strapi }) => ({
      typeDefs: `

        type Query {
          authorsContacts: [AuthorContact]
        }

        type AuthorContact {
          id: ID
          name: String
          email: String
          articles: [Article]
        }

      `,
      
      resolvers: {
        Query: {
          authorsContacts: {
            resolve: async (parent, args, context) => {
              
              const data = await strapi.services["api::writer.writer"].find({
                populate: ["articles"],
              });

              console.log(data)

              return data.results.map(author => ({
                id: author.id,
                name: author.name,
                email: author.email,
                articles: author.articles,
              }));

            }
          }
        },
      },

      resolversConfig: {
        "Query.authorsContacts": {
          auth: false,
        },
      },
    }));
  },
};

