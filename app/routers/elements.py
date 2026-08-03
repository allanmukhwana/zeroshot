from fastapi import APIRouter, Query

from ..schemas import ElementResponse, CreateElementRequest
from ..elements import list_elements, get_element, create_element

router = APIRouter(prefix="/api/elements", tags=["elements"])


@router.get("", response_model=list[ElementResponse])
async def list_elements_api(
    filter: str = Query("all"),
    search: str = Query(""),
):
    return list_elements(filter_type=filter, search=search)


@router.get("/{el_id}")
async def get_element_api(el_id: str):
    el = get_element(el_id)
    if not el:
        return {"error": "Element not found"}
    return el


@router.post("", response_model=ElementResponse)
async def create_element_api(req: CreateElementRequest):
    return create_element(req)
