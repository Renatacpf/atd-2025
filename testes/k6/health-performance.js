import http from 'k6/http';
import { sleep, check, group } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(90)<=10', 'p(95)<=15'],
    http_req_failed: ['rate<0.01'],
    'group_duration{group:::Verificando saúde da API}': ['avg<200'],
    'group_duration{group:::Simulando o pensamento do usuário}': ['avg<1100']
  }
};

export default function() {
  let responseHealth = ''; 

  group('Verificando saúde da API', function() {
    responseHealth = http.get('http://localhost:3000/health');

    check(responseHealth, {
        'status deve ser igual a 200': (r) => r.status === 200,
        'deve retornar sucesso': (r) => r.json('success') === true,
        'deve retornar status healthy': (r) => r.json('data.status') === 'healthy'
    });
  })

  group('Simulando o pensamento do usuário', function() {
    sleep(1); // User Think Time
  })
}
