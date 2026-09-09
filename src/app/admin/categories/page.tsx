import { getAdminCategories } from "@/lib/domain/beauty-connect";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryToggle } from "@/components/admin/admin-actions";
import { SectionHeading, SetupState } from "@/components/shared/ui";

export default async function AdminCategoriesPage() {
  try {
    const categories = await getAdminCategories();
    return (
      <div>
        <SectionHeading
          eyebrow="Configuration"
          title="Specialities"
          description="Maintain one shared speciality list for worker onboarding."
        />
        <div className="mt-8">
          <CategoryForm />
        </div>
        <div className="mt-5 grid gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-4 border border-border bg-background p-5"
            >
              <div>
                <h2 className="font-semibold">{category.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.slug} · order {category.display_order}
                </p>
              </div>
              <CategoryToggle
                categoryId={category.id}
                active={category.is_active}
              />
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    return <SetupState />;
  }
}
