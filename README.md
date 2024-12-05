# Сервис авторизации

## Описание

Данный репозиторий содержит реализацию микросервиса авторизации, входящего в состав проекта ***incidents***.
Для реализации аутентификации была выбранна сессионная логика (**session-based authentication**).
Связь с API-шлюзом осуществляется по **TCP**, средствами фреймворка **Nest**.
В качетсве СУБД была выборана **MongoDB**.

## Установка

### Локально
```bash
# Установка зависимостей
npm install

# Запуск в dev режиме
npm run start:dev
```

### Docker 
```bash
# Создание и запуск docker сервисов
docker-compose up -d
```

## Проектирование

_Диаграммы можно сохранять и редактировать в ***[draw.io](https://app.diagrams.net/)***_

- ### Диаграмма классов (связь сущностей в БД)
  ![Диаграмма классов для сервиса авторизации](https://github.com/user-attachments/assets/b8fbcd32-c2e6-468a-989f-5ecf3078dac0)

- ### Компоненты микросервиса авторизации
  ![Компоненты микросервиса пользователей](https://github.com/user-attachments/assets/43ca904a-7ff4-4bca-ab57-f9d5fd8d3c03)

## Ссылки

- #### Клиентская часть *https://github.com/ByeLarry/incidents-frontend*
- #### API-шлюз:  *https://github.com/ByeLarry/incidents-gateway*
- #### Сервис марок (инцидентов): *https://github.com/ByeLarry/indcidents-marks-service*
- #### Сервис поиска *https://github.com/ByeLarry/incidents-search-service*
- #### Панель администратора *https://github.com/ByeLarry/incidents-admin-frontend.git*
- #### Демонастрация функционала пользовательской части версии 0.1.0: *https://youtu.be/H0-Qg97rvBM*
- #### Демонастрация функционала пользовательской части версии 0.2.0: *https://youtu.be/T33RFvfTxNU*
- #### Демонастрация функционала панели администратора версии 0.1.0: *https://youtu.be/7LTnEMYuzUo*

