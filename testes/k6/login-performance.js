import http from 'k6/http';
import { sleep, check, group } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(90)<=15', 'p(95)<=20'],
    http_req_failed: ['rate<0.01'],
    'group_duration{group:::Fazendo login}': ['avg<300'],
    'group_duration{group:::Simulando o pensamento do usuário}': ['avg<1100']
  }
};

export default function() {
  let responseLogin = ''; 

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
        'status deve ser igual a 200': (r) => r.status === 200,
        'deve retornar token': (r) => r.json('data.token') !== undefined,
        'deve retornar sucesso': (r) => r.json('success') === true
    });
  })

  group('Simulando o pensamento do usuário', function() {
    sleep(1); // User Think Time
  })
}
