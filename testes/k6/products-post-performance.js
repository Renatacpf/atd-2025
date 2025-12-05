import http from 'k6/http';
import { sleep, check, group } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(90)<=800', 'p(95)<=850'],
    http_req_failed: ['rate<0.01'],
    'group_duration{group:::Fazendo login}': ['avg<300'],
    'group_duration{group:::Criando produto}': ['avg<500'],
    'group_duration{group:::Simulando o pensamento do usuário}': ['avg<1100']
  }
};

export default function() {
  let responseLogin = ''; 
  let token = '';

  group('Fazendo login', function() {
    responseLogin = http.post(
        'http://localhost:3000/auth/login', 
        JSON.stringify({ 
            email: 'john@example.com', 
            password: 'password123' 
        }),
        {
            headers: {
                'Content-Type': 'application/json'
            }
    });

    check(responseLogin, {
        'login: status deve ser igual a 200': (r) => r.status === 200,
        'login: deve retornar token': (r) => r.json('data.token') !== undefined
    });

    token = responseLogin.json('data.token');
  })

  group('Criando produto', function() {
    let responseProduct = http.post(
        'http://localhost:3000/products',
        JSON.stringify({ 
            name: `Produto Teste ${Date.now()}${__VU}${__ITER}`,
            description: 'Produto criado durante teste de performance',
            price: 99.99,
            stock: 100
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
    });

    check(responseProduct, {
        'produto: status deve ser igual a 201': (r) => r.status === 201,
        'produto: deve retornar sucesso': (r) => r.json('success') === true,
        'produto: deve retornar dados do produto': (r) => r.json('data.id') !== undefined
    });
  })

  group('Simulando o pensamento do usuário', function() {
    sleep(1); // User Think Time
  })
}
