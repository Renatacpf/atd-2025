import http from 'k6/http';
import { sleep, check, group } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(90)<=500', 'p(95)<=600'],
    http_req_failed: ['rate<0.01'],
    'group_duration{group:::Registrando novo usuário}': ['avg<300'],
    'group_duration{group:::Simulando o pensamento do usuário}': ['avg<1100']
  }
};

export default function() {
  let responseRegister = ''; 
  const randomEmail = `user${Date.now()}${__VU}${__ITER}@example.com`;

  group('Registrando novo usuário', function() {
    responseRegister = http.post(
        'http://localhost:3000/auth/register', 
        JSON.stringify({ 
            email: randomEmail, 
            password: 'password123',
            name: 'Test User' 
        }),
        {
            headers: {
                'Content-Type': 'application/json'
            }
    });

    check(responseRegister, {
        'status deve ser igual a 201': (r) => r.status === 201,
        'deve retornar sucesso': (r) => r.json('success') === true,
        'deve retornar dados do usuário': (r) => r.json('data') !== undefined
    });
  })

  group('Simulando o pensamento do usuário', function() {
    sleep(1); // User Think Time
  })
}
