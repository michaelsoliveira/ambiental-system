import { Card, CardContent } from "@/components/ui/card"
import { PessoaFormValues } from "../../utils/form-schema"
import { MunicipioType, TipoLicencaType } from "types"
import { useTiposLicenca } from "@/hooks/use-tipos-licenca"
import { formatData } from "@/lib/utils"

type PessoaDetailsProps = {
  data: PessoaFormValues & { municipio?: MunicipioType | undefined}
}

export default function ClienteDetails({ data }: PessoaDetailsProps) {
  const { email, telefone, endereco, tipoPessoa } = data
  const { data: dataTiposLicenca = [], isLoading } = useTiposLicenca({ orderBy: 'descricao' });
  const { data: tiposLicenca } = dataTiposLicenca
  
  const tipoLicenca = (tipoLicencaId: string)  => {
    return tiposLicenca?.find((licenca: TipoLicencaType) => licenca.id === tipoLicencaId)
  }

  const isPessoaFisica = tipoPessoa === 'fisica';

  const getEstadoCivilLabel = (estadoCivil: string) => {
    const labels = {
      'solteiro': 'Solteiro(a)',
      'casado': 'Casado(a)',
      'divorciado': 'Divorciado(a)',
      'viuvo': 'Viúvo(a)',
      'uniao_estavel': 'União Estável'
    };
    return labels[estadoCivil as keyof typeof labels] || estadoCivil;
  };

  const getPorteLabel = (porte: string) => {
    const labels = {
      'ME': 'Microempresa',
      'MEI': 'MEI',
      'EPP': 'Empresa de Pequeno Porte',
      'GRANDE': 'Grande Empresa',
      'MICRO': 'Micro Empresa'
    };
    return labels[porte as keyof typeof labels] || porte;
  };

  return (
    <Card className="w-full p-4">
      <CardContent className="space-y-6">

        {/* Sessão - Cliente */}
        <section>
          <h2 className="text-lg font-semibold mb-2">
            {isPessoaFisica ? 'Resumo do Cliente' : 'Resumo da Empresa'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Detail label="Tipo" value={isPessoaFisica ? 'Pessoa Física' : 'Pessoa Jurídica'} />
            
            {isPessoaFisica ? (
              <>
                <Detail label="Nome Completo" value={data.nome} />
                <Detail label="CPF" value={data.cpf} />
                <Detail label="RG" value={`${data.rg} - ${data.orgaoEmissorRg}`} />
                <Detail 
                  label="Data de Nascimento" 
                  value={data.dataNascimento ? formatData({ data: data.dataNascimento }) : "-"} 
                />
                <Detail label="Estado Civil" value={getEstadoCivilLabel(data?.estadoCivil!)} />
                <Detail label="Profissão" value={data.profissao || "-"} />
              </>
            ) : (
              <>
                <Detail label="Nome Fantasia" value={data.nomeFantasia} />
                <Detail label="Razão Social" value={data.razaoSocial} />
                <Detail label="CNPJ" value={data.cnpj} />
                <Detail label="Inscrição Estadual" value={data.inscricaoEstadual || "-"} />
                <Detail label="Inscrição Municipal" value={data.inscricaoMunicipal || "-"} />
                <Detail 
                  label="Data de Abertura" 
                  value={data.dataAbertura ? formatData({ data: data.dataAbertura }) : "-"} 
                />
                <Detail label="Natureza Jurídica" value={data.naturezaJuridica || "-"} />
                <Detail label="Porte" value={data.porte ? getPorteLabel(data.porte) : "-"} />
              </>
            )}
            
            <Detail label="Email" value={email || "-"} />
            <Detail label="Telefone" value={telefone || "-"} />
          </div>
        </section>

        {/* Sessão - Endereço */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Detail label="Logradouro" value={endereco.logradouro || "-"} />
            <Detail label="Número" value={endereco.numero || "-"} />
            <Detail label="Complemento" value={endereco.complemento || "-"} />
            <Detail label="Bairro" value={endereco.bairro || "-"} />
            <Detail label="Município" value={String(data.municipio?.nome) || "-"} />
            <Detail label="Estado" value={String(data.municipio?.estado?.nome) || "-"} />
            <Detail label="CEP" value={endereco.cep || "-"} />
          </div>
        </section>

        {/* Sessão - Licenças */}
        {data.hasLicencaData === true && "licencas" in data && data.licencas.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-2">Licenças</h2>
            <div className="space-y-4">
              {data.licencas.map((licenca: any, index: any) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-base mb-2">Licença #{index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Detail 
                      label="Tipo de Licença" 
                      value={tipoLicenca(licenca.tipoLicencaId)?.descricao || "Tipo não encontrado"} 
                    />
                    <Detail label="Número da Licença" value={licenca.numeroLicenca || "-"} />
                    <Detail label="Status" value={licenca.status?.toUpperCase() || "-"} />
                    <Detail label="Órgão Emissor" value={licenca.orgaoEmissor || "-"} />
                    <Detail 
                      label="Data de Emissão" 
                      value={formatData({ data: licenca.dataEmissao })} 
                    />
                    <Detail 
                      label="Data de Validade" 
                      value={formatData({ data: licenca.dataValidade })} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </CardContent>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-base font-medium">{value}</p>
    </div>
  )
}