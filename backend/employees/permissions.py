from rest_framework import permissions

class CanViewEmployee(permissions.BasePermission):
    """
    Permission to view employee records.
    - Admin/HR can view all.
    - Managers can view their direct reports.
    - Employees can view their own profile.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser or getattr(user, 'is_hr_admin', False):
            return True
        
        # Check if the user is looking at their own profile
        if hasattr(user, 'employee_profile') and user.employee_profile == obj:
            return True
            
        # Check if the user is the manager of the employee
        if getattr(user, 'is_manager', False) and hasattr(user, 'employee_profile'):
            if obj.manager == user.employee_profile:
                return True
                
        return False

class CanManageEmployee(permissions.BasePermission):
    """
    Permission to manage (create/update/delete) employee records.
    - Admin/HR can manage all.
    """
    def has_permission(self, request, view):
        user = request.user
        return user and user.is_authenticated and (user.is_superuser or getattr(user, 'is_hr_admin', False))

    def has_object_permission(self, request, view, obj):
        user = request.user
        return user.is_superuser or getattr(user, 'is_hr_admin', False)
