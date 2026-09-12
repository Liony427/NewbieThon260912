"""Run with DATABASE_URL=sqlite:// python -m unittest discover -s backend/tests."""
import unittest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.database import Base, get_db
from backend.models import User
from backend.routers.auth import router, password_hasher


class SignupTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        app = FastAPI()
        app.include_router(router)
        def database():
            with self.sessions() as session:
                yield session
        app.dependency_overrides[get_db] = database
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def test_signup_then_login_and_duplicate(self):
        body = {'email': 'NewUser@example.com', 'password': 'password123'}
        response = self.client.post('/auth/signup', json=body)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['email'], 'newuser@example.com')
        self.assertEqual(response.json()['name'], 'newuser')
        self.assertNotIn('password_hash', response.json())
        with self.sessions() as db:
            user = db.scalar(select(User))
            self.assertNotEqual(user.password_hash, body['password'])
            self.assertTrue(password_hasher.verify(body['password'], user.password_hash))
        login = self.client.post('/auth/login', json=body)
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json()['user']['id'], response.json()['id'])
        self.assertEqual(self.client.post('/auth/signup', json={**body, 'email': 'newuser@example.com'}).status_code, 409)
        self.assertEqual(self.client.post('/auth/login', json={**body, 'password': 'wrong'}).status_code, 401)

    def test_invalid_input(self):
        for body in [
            {'email': 'invalid', 'password': 'password123'},
            {'email': 'user@example.com', 'password': 'short'},
            {'email': 'user@example.com', 'password': 'a' * 21},
            {'email': 'user@example.com'},
        ]:
            with self.subTest(body=body):
                self.assertEqual(self.client.post('/auth/signup', json=body).status_code, 422)

    def test_existing_name_clients_remain_supported(self):
        response = self.client.post('/auth/signup', json={'name': '사용자', 'email': 'named@example.com', 'password': 'password123'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['name'], '사용자')

    def test_password_length_boundaries(self):
        for length in (8, 20):
            with self.subTest(length=length):
                response = self.client.post('/auth/signup', json={
                    'email': f'boundary{length}@example.com',
                    'password': 'a' * length,
                })
                self.assertEqual(response.status_code, 201)
