import http from 'k6/http';
import { sleep, check, group } from 'k6';

export const options = {
  scenarios: {
    login: {
      executor: 'constant-vus',
      exec: 'loginScenario',
      vus: 10,
      duration: '30s',
      tags: { test_type: 'login' },
    },
    register: {
      executor: 'constant-vus',
      exec: 'registerScenario',
      vus: 10,
      duration: '30s',
      startTime: '35s',
      tags: { test_type: 'register' },
    },
    health: {
      executor: 'constant-vus',
      exec: 'healthScenario',
      vus: 10,
      duration: '30s',
      startTime: '70s',
      tags: { test_type: 'health' },
    },
    productsGet: {
      executor: 'constant-vus',
      exec: 'productsGetScenario',
      vus: 10,
      duration: '30s',
      startTime: '105s',
      tags: { test_type: 'products_get' },
    },
    productsPost: {
      executor: 'constant-vus',
      exec: 'productsPostScenario',
      vus: 10,
      duration: '30s',
      startTime: '140s',
      tags: { test_type: 'products_post' },
    },
    checkout: {
      executor: 'constant-vus',
      exec: 'checkoutScenario',
      vus: 10,
      duration: '30s',
      startTime: '175s',
      tags: { test_type: 'checkout' },
    },
  },
  thresholds: {
    http_req_duration: ['p(90)<=900', 'p(95)<=950'],
    http_req_failed: ['rate<0.01'],
  }
};

// Cenário: Login
export function loginScenario() {
  let responseLogin = '';

  group('Login', function() {
    responseLogin = http.post(
      'http://localhost:3000/auth/login',
      JSON.stringify({
        email: 'john@example.com',
        password: 'password123'
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    check(responseLogin, {
      'login: status 200': (r) => r.status === 200,
      'login: retorna token': (r) => r.json('data.token') !== undefined
    });
  });

  sleep(1);
}

// Cenário: Register
export function registerScenario() {
  const randomEmail = `user${Date.now()}${__VU}${__ITER}@example.com`;

  group('Register', function() {
    let responseRegister = http.post(
      'http://localhost:3000/auth/register',
      JSON.stringify({
        email: randomEmail,
        password: 'password123',
        name: 'Test User'
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    check(responseRegister, {
      'register: status 201': (r) => r.status === 201,
      'register: sucesso': (r) => r.json('success') === true
    });
  });

  sleep(1);
}

// Cenário: Health
export function healthScenario() {
  group('Health Check', function() {
    let responseHealth = http.get('http://localhost:3000/health');

    check(responseHealth, {
      'health: status 200': (r) => r.status === 200,
      'health: healthy': (r) => r.json('data.status') === 'healthy'
    });
  });

  sleep(1);
}

// Cenário: Get Products
export function productsGetScenario() {
  let token = '';

  group('Login para produtos', function() {
    let responseLogin = http.post(
      'http://localhost:3000/auth/login',
      JSON.stringify({
        email: 'john@example.com',
        password: 'password123'
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    token = responseLogin.json('data.token');
  });

  group('Listar Produtos', function() {
    let responseProducts = http.get('http://localhost:3000/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    check(responseProducts, {
      'products get: status 200': (r) => r.status === 200,
      'products get: é array': (r) => Array.isArray(r.json('data'))
    });
  });

  sleep(1);
}

// Cenário: Create Product
export function productsPostScenario() {
  let token = '';

  group('Login para criar produto', function() {
    let responseLogin = http.post(
      'http://localhost:3000/auth/login',
      JSON.stringify({
        email: 'john@example.com',
        password: 'password123'
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    token = responseLogin.json('data.token');
  });

  group('Criar Produto', function() {
    let responseProduct = http.post(
      'http://localhost:3000/products',
      JSON.stringify({
        name: `Produto ${Date.now()}${__VU}${__ITER}`,
        description: 'Produto de teste',
        price: 99.99,
        stock: 100
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    check(responseProduct, {
      'products post: status 201': (r) => r.status === 201,
      'products post: retorna id': (r) => r.json('data.id') !== undefined
    });
  });

  sleep(1);
}

// Cenário: Checkout
export function checkoutScenario() {
  let token = '';
  let productId1 = '';
  let productId2 = '';

  group('Login para checkout', function() {
    let responseLogin = http.post(
      'http://localhost:3000/auth/login',
      JSON.stringify({
        email: 'john@example.com',
        password: 'password123'
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    token = responseLogin.json('data.token');
  });

  group('Criar produtos para checkout', function() {
    let responseProduct1 = http.post(
      'http://localhost:3000/products',
      JSON.stringify({
        name: `Produto Checkout 1 ${Date.now()}${__VU}${__ITER}`,
        description: 'Produto para checkout',
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

    if (responseProduct1.status === 201) {
      productId1 = responseProduct1.json('data.id');
    }

    let responseProduct2 = http.post(
      'http://localhost:3000/products',
      JSON.stringify({
        name: `Produto Checkout 2 ${Date.now()}${__VU}${__ITER}`,
        description: 'Produto para checkout',
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

    if (responseProduct2.status === 201) {
      productId2 = responseProduct2.json('data.id');
    }
  });

  group('Realizar Checkout', function() {
    let responseCheckout = http.post(
      'http://localhost:3000/checkout',
      JSON.stringify({
        items: [
          { productId: productId1, quantity: 2 },
          { productId: productId2, quantity: 1 }
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
      'checkout: status 200': (r) => r.status === 200,
      'checkout: sucesso': (r) => r.json('success') === true,
      'checkout: retorna id': (r) => r.json('data.id') !== undefined,
      'checkout: retorna total': (r) => r.json('data.total') !== undefined
    });
  });

  sleep(1);
}
