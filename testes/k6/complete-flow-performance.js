import http from 'k6/http';
import { sleep, check, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const REGISTER_ENDPOINT = '/auth/register';
const LOGIN_ENDPOINT = '/auth/login';
const PRODUCTS_ENDPOINT = '/products';
const CHECKOUT_ENDPOINT = '/checkout';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // p95 < 2 segundos
    http_req_failed: ['rate<0.01']
  }
};

export default function() {
  let token = '';
  let productId1 = '';
  let productId2 = '';
  const uniqueEmail = `user${Date.now()}${__VU}${__ITER}@example.com`;

  // 1. Registrar usuário
  group('Registrando novo usuário', function() {
    let responseRegister = http.post(
      `${BASE_URL}${REGISTER_ENDPOINT}`,
      JSON.stringify({
        email: uniqueEmail,
        password: 'password123',
        name: 'Test User'
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    check(responseRegister, {
      'register: status deve ser 201': (r) => r.status === 201,
      'register: deve retornar sucesso': (r) => r.json('success') === true
    });
  });

  sleep(1);

  // 2. Fazer login
  group('Fazendo login', function() {
    let responseLogin = http.post(
      `${BASE_URL}${LOGIN_ENDPOINT}`,
      JSON.stringify({
        email: uniqueEmail,
        password: 'password123'
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    check(responseLogin, {
      'login: status deve ser 200': (r) => r.status === 200,
      'login: deve retornar token': (r) => r.json('data.token') !== undefined
    });

    token = responseLogin.json('data.token');
  });

  sleep(1);

  // 3. Criar produtos
  group('Criando produtos', function() {
    // Criar produto 1
    let responseProduct1 = http.post(
      `${BASE_URL}${PRODUCTS_ENDPOINT}`,
      JSON.stringify({
        name: `Produto 1 ${Date.now()}${__VU}${__ITER}`,
        description: 'Produto para teste',
        price: 50.00,
        stock: 100
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    check(responseProduct1, {
      'produto1: status deve ser 201': (r) => r.status === 201,
      'produto1: deve retornar ID': (r) => r.json('data.id') !== undefined
    });

    if (responseProduct1.status === 201) {
      productId1 = responseProduct1.json('data.id');
    }

    // Criar produto 2
    let responseProduct2 = http.post(
      `${BASE_URL}${PRODUCTS_ENDPOINT}`,
      JSON.stringify({
        name: `Produto 2 ${Date.now()}${__VU}${__ITER}`,
        description: 'Produto para teste',
        price: 75.00,
        stock: 100
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    check(responseProduct2, {
      'produto2: status deve ser 201': (r) => r.status === 201,
      'produto2: deve retornar ID': (r) => r.json('data.id') !== undefined
    });

    if (responseProduct2.status === 201) {
      productId2 = responseProduct2.json('data.id');
    }
  });

  sleep(1);

  // 4. Realizar checkout
  group('Realizando checkout', function() {
    let responseCheckout = http.post(
      `${BASE_URL}${CHECKOUT_ENDPOINT}`,
      JSON.stringify({
        items: [
          {
            productId: productId1,
            quantity: 2
          },
          {
            productId: productId2,
            quantity: 1
          }
        ],
        paymentMethod: 'credit_card'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    check(responseCheckout, {
      'checkout: status deve ser 200': (r) => r.status === 200,
      'checkout: deve retornar ID': (r) => r.json('data.id') !== undefined,
      'checkout: deve retornar total': (r) => r.json('data.total') !== undefined
    });
  });

  sleep(1);
}
