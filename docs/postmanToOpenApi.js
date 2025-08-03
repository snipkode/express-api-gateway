const postmanToOpenApi = require('postman-to-openapi');
const path = require('path');

const postmanCollection = path.join(__dirname, 'v1.0.0.json');
const outputFile = path.join(__dirname, 'swagger-output.yaml');

async function convertAndServe() {
  try {
    // Konversi Postman JSON ke OpenAPI JSON
    const openApiSpec = await postmanToOpenApi(postmanCollection, outputFile, { defaultTag: 'General' });

    console.log('Postman collection converted to OpenAPI successfully!');
    // Setelah konversi berhasil, file swagger-output.json siap digunakan
    // oleh swagger-ui-express.
  } catch (err) {
    console.error('Conversion failed!', err);
  }
}

convertAndServe();