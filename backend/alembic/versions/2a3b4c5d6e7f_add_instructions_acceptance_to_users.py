"""add instructions acceptance columns to users

Revision ID: 2a3b4c5d6e7f
Revises: 1c8f3e2a9b4d
Create Date: 2026-10-12 21:50:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a3b4c5d6e7f'
down_revision: str | Sequence[str] | None = '1c8f3e2a9b4d'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('has_accepted_instructions', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    )
    op.add_column(
        'users',
        sa.Column('instructions_accepted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'users',
        sa.Column('instructions_version', sa.String(length=50), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('users', 'instructions_version')
    op.drop_column('users', 'instructions_accepted_at')
    op.drop_column('users', 'has_accepted_instructions')
