from database import SessionLocal
from schemas import UserCreate
import crud, traceback


def run():
    db = SessionLocal()
    try:
        user = crud.create_user(db, UserCreate(email='test2@example.com', password='password123'))
        print('created', user)
    except Exception:
        traceback.print_exc()
    finally:
        db.close()


if __name__ == '__main__':
    run()
