import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const deduplicatePermissions = (permissions) => {
  const unique = new Map();

  permissions.forEach((permission) => {
    if (!permission) {
      return;
    }

    const key = permission.permissionId || permission.name || permission.code;
    if (key && !unique.has(key)) {
      unique.set(key, permission);
    }
  });

  return Array.from(unique.values());
};

class User extends Model {
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  async hasRole(roleNames) {
    const expected = toArray(roleNames);
    if (expected.length === 0) {
      return false;
    }

    let roles = Array.isArray(this.roles) ? this.roles : [];

    if (roles.length === 0 && this.assignedRole) {
      roles = [this.assignedRole];
    }

    if (roles.length === 0 && typeof this.getRoles === 'function') {
      roles = await this.getRoles();
    }

    return roles.some((role) => expected.includes(role.name));
  }

  async getAllPermissions() {
    let roles = Array.isArray(this.roles) ? this.roles : [];

    // Si on a assignedRole chargé mais pas via l'association 'roles'
    if (roles.length === 0 && this.assignedRole) {
      roles = [this.assignedRole];
    }

    // Si aucun rôle n'est chargé en mémoire, on les récupère avec leurs permissions
    if (roles.length === 0 && typeof this.getRoles === 'function') {
      roles = await this.getRoles({
        include: [{ association: 'permissions', through: { attributes: [] } }]
      });
    }

    // On s'assure que chaque rôle a ses permissions chargées
    for (const role of roles) {
      if (!role.permissions && typeof role.getPermissions === 'function') {
        role.permissions = await role.getPermissions();
      }
    }

    const directPermissions = Array.isArray(this.directPermissions)
      ? this.directPermissions
      : typeof this.getDirectPermissions === 'function'
        ? await this.getDirectPermissions()
        : [];

    const rolePermissions = roles.flatMap((role) => role.permissions || []);
    return deduplicatePermissions([...rolePermissions, ...directPermissions]);
  }

  async getAllPermissionNames() {
    const permissions = await this.getAllPermissions();
    return Array.from(new Set(
      permissions
        .flatMap(p => [p.name, p.code])
        .filter(Boolean)
    ));
  }

  async hasPermission(permissionName) {
    if (await this.hasRole('ADMINISTRATOR')) {
      return true;
    }

    const permissions = await this.getAllPermissions();
    return permissions.some((permission) => {
      const candidates = [permission.name, permission.code].filter(Boolean);
      return candidates.includes(permissionName);
    });
  }
}

User.init({
  userId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  id: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.userId;
    }
  },
  queueId: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.assignedQueueId;
    }
  },
  role: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.assignedRole?.name || this.roles?.[0]?.name || null;
    }
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'roles',
      key: 'roleId'
    }
  },
  siteId: {
    type: DataTypes.UUID,
    references: { model: 'Site', key: 'siteId' }
  },
  companyId: {
    type: DataTypes.UUID,
    references: { model: 'Company', key: 'companyId' }
  },
  assignedQueueId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Queue', key: 'queueId' }
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(100)
  },
  lastName: {
    type: DataTypes.STRING(100)
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  failedAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'User',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  underscored: false
});

export default User;
