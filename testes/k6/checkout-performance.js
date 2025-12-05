import http from 'k6/http';
import { sleep, check, group } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(90)<=900', 'p(95)<=950'],
    http_req_failed: ['rate<0.01'],
    'group_duration{group:::Fazendo login}': ['avg<700'],
    'group_duration{group:::Realizando checkout}': ['avg<600'],
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

  group('Realizando checkout', function() {
    let responseCheckout = http.post(
        'http://localhost:3000/checkout',
        JSON.stringify({ 
            items: [
                {
                    productId: 1,
                    quantity: 2
                },
                {
                    productId: 2,
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
    });

    check(responseCheckout, {
        'checkout: status deve ser igual a 200': (r) => r.status === 200,
        'checkout: deve retornar sucesso': (r) => r.json('success') === true,
        'checkout: deve retornar dados do pedido': (r) => r.json('data.orderId') !== undefined,
        'checkout: deve retornar total': (r) => r.json('data.total') !== undefined
    });
  })

  group('Simulando o pensamento do usuário', function() {
    sleep(1); // User Think Time
  })
}
