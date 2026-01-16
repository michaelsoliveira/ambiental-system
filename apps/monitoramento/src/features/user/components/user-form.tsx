'use client'
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { UserFormValues, userSchema } from "../utils/form-schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Role {
  id: string;
  name: string;
}

interface Props {
  defaultValues?: Partial<UserFormValues> & { id?: string };
  onClose?: () => void;
  roles?: Role[];
}

export function UserForm({ defaultValues, onClose, roles }: Props) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: defaultValues?.username ?? "",
      email: defaultValues?.email ?? "",
      password: defaultValues?.password ?? "",
      roles: defaultValues?.roles ?? [],
    },
  });

  const { client } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function onSubmit(data: UserFormValues) {
    console.log(data)
    const isValid = await form.trigger();
    if (!isValid) return;

    setLoading(true);
    try {
      const response = defaultValues?.id
        ? await client.put(`/users/update/${defaultValues.id}`, data)
        : await client.post(`/users/create`, data);
      
      const { error, message } = response.data;
      if (!error) {
        toast.success(message);
        // router.push("/dashboard/user");
      } else {
        toast.error(message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar usuário");
    } finally {
      setLoading(false);
      onClose?.();
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="form-user">
        <div
            className='w-full flex flex-col md:grid md:grid-cols-2 gap-4 mt-4'
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: joaosilva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Ex: email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Senha segura" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-4">
              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Papéis</FormLabel>
                    <div className="space-y-4 mt-2">
                      {roles?.map((role) => (
                        <FormField
                          key={role.id}
                          control={form.control}
                          name="roles"
                          render={({ field: subField }) => {
                            return (
                              <FormItem key={role.id} className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={subField.value?.includes(role.id)}
                                    onCheckedChange={(checked) => {
                                      const value = subField.value || [];
                                      subField.onChange(
                                        checked
                                          ? [...value, role.id]
                                          : value.filter((id) => id !== role.id)
                                      );
                                    }}
                                  />
                                </FormControl>
                                <Label>{role.name}</Label>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
      </form>
    </Form>
  );
}
