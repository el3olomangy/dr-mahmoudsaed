from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .security import decode_token
from .database import get_db

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db=Depends(get_db)
):
    token = credentials.credentials
    payload = decode_token(token, token_type="access")

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token غير صالح أو منتهي"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token غير صالح")

    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="المستخدم مش موجود")

    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="الحساب موقوف")

    return user

async def get_current_teacher(current_user=Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="محتاج صلاحية مدرس")
    return current_user

async def get_current_student(current_user=Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="محتاج صلاحية طالب")
    return current_user

async def get_current_teacher_or_assistant(current_user=Depends(get_current_user)):
    if current_user["role"] not in ["teacher", "assistant"]:
        raise HTTPException(status_code=403, detail="محتاج صلاحية مدرس أو مساعد")
    return current_user